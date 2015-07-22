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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'jquery',
    'lodash',
    'taoQtiTest/testRunner/actionBar/markForReview'
], function($, _, markForReview) {
    'use strict';

    // global mock for button config
    var configMock = {
        label: 'Mark for review',
        icon: 'anchor',
        hook: 'taoQtiTest/testRunner/actionBar/markForReview'
    };


    QUnit.module('markForReview');


    QUnit.test('module', function(assert) {
        assert.equal(typeof markForReview, 'object', "The markForReview module exposes an object");
    });


    var testReviewApi = [
        { name : 'init', title : 'init' },
        { name : 'clear', title : 'clear' },
        { name : 'isVisible', title : 'isVisible' }
    ];

    QUnit
        .cases(testReviewApi)
        .test('API ', function(data, assert) {
            assert.equal(typeof markForReview[data.name], 'function', 'The markForReview module exposes a "' + data.title + '" function');
        });


    QUnit.test('button enabled/disabled', function(assert) {
        var testContextMock = {
            reviewScreen: true,
            navigatorMap: []
        };

        assert.ok(markForReview.isVisible(configMock, testContextMock), 'The markForReview button is visible when the test taker screen is enabled');

        testContextMock.reviewScreen = false;
        assert.ok(!markForReview.isVisible(configMock, testContextMock), 'The markForReview button is not visible when the test taker screen is disabled');
    });


    QUnit.asyncTest('button install/uninstall', function(assert) {
        var callExpected = true;
        var testRunnerMock = {
            markForReview: function() {
                if (callExpected) {
                    assert.ok(true, 'The button must trigger a call to markForReview');
                    QUnit.start();
                } else {
                    assert.ok(false, 'The button must not trigger a call to markForReview');
                }
            }
        };

        var testContextMock = {
            reviewScreen: true,
            navigatorMap: []
        };

        var $btn = $('#mark-for-review-1');

        markForReview.init($btn, configMock, testContextMock, testRunnerMock);

        $btn.click();

        markForReview.clear();

        QUnit.stop();
        _.defer(function() {
            assert.ok(true, 'The button is uninstalled and did not trigger a call to markForReview');
            QUnit.start();
        }, 100);
        $btn.click();

    });


    QUnit.test('button active/idle', function(assert) {
        var testRunnerMock = {
            markForReview: function() {}
        };

        var testContextMock = {
            reviewScreen: true,
            navigatorMap: [],
            itemFlagged: true
        };

        var $btn = $('#mark-for-review-2');

        markForReview.init($btn, configMock, testContextMock, testRunnerMock);
        assert.ok($btn.hasClass('active'), 'The markForReview button is activated when the current item is flagged');


        $btn = $('#mark-for-review-3');

        testContextMock.itemFlagged = false;
        markForReview.init($btn, configMock, testContextMock, testRunnerMock);
        assert.ok(!$btn.hasClass('active'), 'The markForReview button is idled when the current item is not flagged');
    });


    QUnit.asyncTest('button click', function(assert) {
        var expectedFlag = true;
        var expectedPosition = 1;

        var testRunnerMock = {
            markForReview: function(flag, itemPosition) {
                assert.equal(flag, expectedFlag, 'The markForReview button must call the markForReview action with the right flag state');
                assert.equal(itemPosition, expectedPosition, 'The markForReview button must call the markForReview action with the right item position');
                assert.equal(!$btn.hasClass('active'), flag, 'The markForReview button is active when the current item is flagged, or idle when the current item is not flagged');
                QUnit.start();
            }
        };

        var testContextMock = {
            reviewScreen: true,
            navigatorMap: [],
            itemFlagged: false,
            itemPosition: 1
        };

        var $btn = $('#mark-for-review-4');

        markForReview.init($btn, configMock, testContextMock, testRunnerMock);
        assert.ok(!$btn.hasClass('active'), 'The markForReview button is idled when the current item is not flagged');

        $btn.click();

        QUnit.stop();
        expectedFlag = false;
        $btn.click();

        QUnit.stop();
        expectedFlag = true;
        expectedPosition = 2;
        testContextMock.itemPosition = 2;
        $btn.click();

        QUnit.stop();
        expectedFlag = false;
        $btn.click();
    });

});
