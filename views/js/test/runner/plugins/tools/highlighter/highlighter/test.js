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
/**
 * @author Christophe Noël <christophe@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'helpers',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/highlighter/highlighter'
], function($, _, helpers, runnerFactory, providerMock, highlighterFactory) {
    'use strict';

    QUnit.module('highlighterFactory');

    QUnit.test('module', function(assert) {
        assert.ok(typeof highlighterFactory === 'function', 'the module expose a function');
    });

    QUnit.module('highlighter');

    QUnit.test('can highlight text', function(assert) {
        var range = document.createRange();
        var toSelect = document.getElementById('outside-container2');
        var insider = document.getElementById('insider');
        var highlightContainer = document.createElement('span');

        highlightContainer.setAttribute('class', 'highlighted');

        // range.setStartBefore(toSelect);
        // range.setEndAfter(toSelect);
        range.setStart(toSelect.firstChild, 5);
        range.setEnd(insider.firstChild, 5);

        // range.surroundContents(highlightContainer);
        highlightContainer.appendChild(range.extractContents());
        range.insertNode(highlightContainer);
        QUnit.expect(0);
    });



});
