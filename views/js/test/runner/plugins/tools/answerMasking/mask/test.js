/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'taoQtiTest/runner/plugins/tools/answerMasking/mask'
], function($, maskComponentFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        QUnit.expect(1);
        assert.equal(typeof maskComponentFactory, 'function', "The module exposes a function");
    });

    QUnit.test('factory', function(assert) {
        QUnit.expect(2);
        assert.equal(typeof maskComponentFactory(), 'object', "The factory creates an object");
        assert.notDeepEqual(maskComponentFactory(), maskComponentFactory(), "The factory creates a new object");
    });

    QUnit.cases([
        {name : 'init',         title : 'init'},
        {name : 'destroy',      title : 'destroy'},
        {name : 'render',       title : 'render'},
        {name : 'show',         title : 'show'},
        {name : 'hide',         title : 'hide'},
        {name : 'enable',       title : 'enable'},
        {name : 'disable',      title : 'disable'},
        {name : 'is',           title : 'is'},
        {name : 'setState',     title : 'setState'},
        {name : 'getContainer', title : 'getContainer'},
        {name : 'getElement',   title : 'getElement'},
        {name : 'getTemplate',  title : 'getTemplate'},
        {name : 'setTemplate',  title : 'setTemplate'}
    ])
    .test('component API contains ', function(data, assert) {
        var component = maskComponentFactory();
        QUnit.expect(1);
        assert.equal(typeof component[data.name], 'function', 'The component has the method ' + data.name);
    });


    QUnit.module('Behavior');

    QUnit.asyncTest('DOM', function(assert) {
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        QUnit.expect(9);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal($container.children().length, 0, 'The container is empty');

        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element = $('.mask', $container);
                assert.equal($element.length, 1, 'The component has been attached to the container');
                assert.ok($element.hasClass('rendered'), 'The component has the rendered class');
                assert.equal($('.controls', $element).length, 1, 'The controls element is there');
                assert.equal($('.controls .view', $element).length, 1, 'The view controls element is there');
                assert.equal($('.controls .close', $element).length, 1, 'The close controls element is there');
                assert.deepEqual($element[0], this.getElement()[0], 'The found element match the one bound to the component');

                QUnit.start();
            })
            .init({})
            .render($container);
    });

    QUnit.asyncTest('move', function(assert) {
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        QUnit.expect(8);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('init', function(){
                assert.equal(this.config.x, 5, 'The default position for x has been taken in account');
                assert.equal(this.config.y, 5, 'The default position for y has been taken in account');
            })
            .on('render', function() {
                var $element = this.getElement();
                var tr1 = window.getComputedStyle($element[0]).getPropertyValue('transform');

                assert.equal(tr1, 'matrix(1, 0, 0, 1, 5, 5)', 'The element has been translated to 5,5');

                this
                    .on('move', function() {
                        var tr2 = window.getComputedStyle($element[0]).getPropertyValue('transform');

                        assert.equal(tr2, 'matrix(1, 0, 0, 1, 15, 15)', 'The element has been translated to 15,15');

                        assert.equal(this.config.x, 15, 'The new position for x has been taken in account');
                        assert.equal(this.config.y, 15, 'The new position for y has been taken in account');

                        QUnit.start();
                    })
                    .moveTo(10, 10);
            })
            .init({
                x : 5,
                y : 5
            })
            .render($container);
    });

    QUnit.asyncTest('resize', function(assert) {
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        QUnit.expect(8);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('init', function(){
                assert.equal(this.config.width, 300, 'The default width has been taken in account');
                assert.equal(this.config.height, 300, 'The default height has been taken in account');
            })
            .on('render', function() {
                var $element = this.getElement();

                assert.equal($element.width(), 300, 'The computed width matches');
                assert.equal($element.height(), 300, 'The computed height matches');

                this
                    .on('resize', function(){
                        assert.equal($element.width(), 100, 'The computed width matches');
                        assert.equal($element.height(), 100, 'The computed height matches');
                        QUnit.start();
                    }).resize(100, 100);
            })
            .init({
                width: 300,
                height: 300
            })
            .render($container);
    });

    QUnit.asyncTest('preview', function(assert) {
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        QUnit.expect(12);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element    = this.getElement();
                var $inner      = $('.inner', $element);
                var $previewBtn = $('.view', $element);

                assert.equal($previewBtn.length, 1, 'The preview button exists');
                assert.equal($inner.length, 1, 'The inner element exists');
                assert.ok(!this.is('previewing'), 'We are not previewing');
                assert.ok(!$element.hasClass('previewing'), 'We are not previewing');
                assert.equal($inner.css('opacity'), 1, 'The inner element is opaque');

                $previewBtn.trigger('click');
            })
            .on('preview', function(){
                var self     = this;
                var $element = this.getElement();
                var $inner   = $('.inner', $element);

                assert.ok(this.is('previewing'), 'We are previewing');
                assert.ok($element.hasClass('previewing'), 'We are previewing');

                //takes into account the CSS transition
                setTimeout(function(){
                    assert.ok(parseFloat($inner.css('opacity')) < 1, 'The inner element is transparent');
                }, 650);

                setTimeout(function(){
                    assert.ok(!self.is('previewing'), 'We are not previewing anymore');
                }, 1050);

                setTimeout(function(){
                    assert.equal($inner.css('opacity'), 1, 'The inner element is opaque again');
                    QUnit.start();
                }, 1650);
            })
            .init({
                previewDelay: 1000
            })
            .render($container);
    });

    QUnit.asyncTest('close', function(assert) {
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        QUnit.expect(3);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element  = this.getElement();
                var $closeBtn = $('.close', $element);

                assert.equal($closeBtn.length, 1, 'The preview button exists');

                $closeBtn.trigger('click');
            })
            .on('destroy', function(){
                QUnit.start();
            })
            .init({})
            .render($container);
    });


    QUnit.module('Visual');

    QUnit.asyncTest('visual test', function(assert) {
        var $container = $('#outside');

        QUnit.expect(1);

        maskComponentFactory()
            .on('render', function(){
                assert.ok(true);
                QUnit.start();
            })
            .init({
                x : 0,
                y : 0,
                width: 300,
                height: 200
            })
            .render($container);
    });
});
