/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires cards/core/pluginifier
 * @requires cards/core/dataattrhandler
 */
define(['jquery', 'cards/core/pluginifier', 'cards/core/dataattrhandler'], function($, Pluginifier, DataAttrHandler){
   'use strict';
   
   var ns = 'inplacer';
   var dataNs = 'cards.' + ns;
   
   var defaults = {
       bindEvent   : 'click',
       inplaceClass: 'inplace' 
   };
   
   /** 
    * The InPlacer component, 
    * @exports cards/inplacer
    */
   var InPlacer = {
       
        /**
         * Initialize the plugin.
         * 
         * Called the jQuery way once registered by the Pluginifier.
         * @example $('selector').inplacer({target : $('target') });
         * @public
         * 
         * @constructor
         * @param {Object} options - the plugin options
         * @param {jQueryElement} options.target - the element to be toggled
         * @param {string|boolean} [options.bindEvent = 'click'] - the event that trigger the toggling
         * @param {string} [options.openedClass = 'opened'] - the css added to element (not the target) for the opened state
         * @param {string} [options.closedClass = 'closed'] - the css added to element (not the target) for the closed state
         * @fires InPlacer#create.inplacer
         * @returns {jQueryElement} for chaining
         */
        init : function(options){
            
            //get options using default
            options = $.extend(true, {}, defaults, options);
           
            return this.each(function() {
                var $elt = $(this);
                var $target = options.target;
                
                if(!/^#/.test($target.selector)){
                    $.error('The target selector must be an id.');
                }
                
                if($target.length === 0){
                    //add an hidden field next to the edited element
                    $elt.after("<input id='" + $target.selector.replace('#', '') + "' type='hidden' />");
                    options.target = $($target.selector);
                } else if($target.prop('tagName') !== 'INPUT') {
                    $.error('The target must be an input element.');
                }
                
                //add data to the element
                $elt.data(dataNs, options);
                
                $elt.addClass(options.inplaceClass);
                
                InPlacer._sync($elt, $target);
                
                //bind an event to trigger the toggling
                if(options.bindEvent !== false){
                    $elt.on(options.bindEvent, function(e){
                        e.preventDefault();
                        InPlacer._toggle($(this));
                     });
                }
                
                /**
                 * The plugin have been created.
                 * @event InPlacer#create.inplacer
                 */
                $elt.trigger('create.' + ns);
            });
       },
       
       /**
        * Toggle state.
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').inplacer('toggle');
        * @public
        * 
        * @returns {jQueryElement} for chaining
        */
       toggle : function(){
           return this.each(function() {
                InPlacer._toggle($(this));
           });
       },
       
       /**
        * Internal state toggling mechanism.
        * 
        * @private
        * @param {jQueryElement} $elt - plugin's element 
        * @fires InPlacer#toggle.inplacer
        */
       _toggle : function($elt){
           if($elt.children(':text').length > 0){
               this._leave($elt);
           } else {
               this._edit($elt);
           }
       },
       
       /**
        * Change the state to the edit mode.
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').inplacer('edit');
        * @public
        * 
        * @returns {jQueryElement} for chaining
        */
       edit : function(){
           return this.each(function() {
                InPlacer._edit($(this));
           });
       },
               
       /**
        * Internal mechanism to update the state to the edit mode.
        * 
        * @private
        * @param {jQueryElement} $elt - plugin's element 
        * @fires InPlacer#edit.inplacer
        */
       _edit: function($elt){
            var self = this;
            var options = $elt.data(dataNs);
            var $target = options.target;
            var text = $elt.text();
            $elt.empty()
                .append("<input type='text' value='" + text + "' />")
                .children(':input')
                .width(options.width || $elt.width())
                .off('click')
                .change(function(e){
                    e.stopPropagation();    //the change evt is triggered on the top element on leaving
                })
                .keyup(function(e){
                    if(e.which === 13){
                        self._leave($elt);
                    }
                })
                .blur(function(){
                    self._leave($elt);
                })
                .focus();
            
            self._sync($elt, $target);
        
           /**
            * The element is in edit state
            * @event InPlacer#edit.inplacer
            * @param {string} value - the current value
            */
            $elt.trigger('edit.' + ns, [$target.val()]);
       },
       
       /**
        * Leave the edit mode to the normal mode.
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').inplacer('_leave');
        * @public
        * 
        * @returns {jQueryElement} for chaining
        */
       leave : function(){
           return this.each(function() {
                InPlacer._leave($(this));
           });
       },
       
       /**
        * Internal mechanism to leave the edit mode.
        * 
        * @private
        * @param {jQueryElement} $elt - plugin's element 
        * @fires InPlacer#leave.inplacer
        */
       _leave: function($elt){
            var options = $elt.data(dataNs);
            var $target = options.target;
            
            $elt.text($elt.children(':text').val()).children(':text').remove();
            
            
            this._sync($elt, $target);
            
            /**
            * The target has been toggled. 
            * @event InPlacer#leave.inplacer
            * @param {string} value - the current value
            */
            $elt.trigger('leave.' + ns, [$target.val()]);
            $elt.trigger('change');
       },
       
       /**
        * Keep the the target and the element value in sync.
        * 
        * @private
        * @param {jQueryElement} $elt - plugin's element 
        * @param {jQueryElement} $target - the target to be in sync with
        */
       _sync : function($elt, $target){
           if($elt.children(':text').length > 0){
               $target.val($elt.children(':text').val());
           } else {
               $target.val($elt.text());
           } 
       },
               
       /**
        * Destroy completely the plugin.
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').inplacer('destroy');
        * @public
        */
       destroy : function(){
            this.each(function() {
                var $elt = $(this);
                var options = $elt.data(dataNs);
                options.removeClass(options.inplaceClass);
                if(options.bindEvent !== false){
                    $elt.off(options.bindEvent);
                }
                
                /**
                 * The plugin have been destroyed.
                 * @event InPlacer#destroy.inplacer
                 */
                $elt.trigger('destroy.' + ns);
            });
        }
   };
   
   //Register the inplacer to behave as a jQuery plugin.
   Pluginifier.register(ns, InPlacer);
   
   /**
    * The only exposed function is used to start listening on data-attr
    * 
    * @public
    * @example define(['cards/inplacer'], function(inplacer){ inplacer($('rootContainer')); });
    * @param {jQueryElement} $container - the root context to listen in
    */
   return function listenDataAttr($container){
       
        new DataAttrHandler('in-place', {
            container: $container,
            listenerEvent: 'click',
            namespace: dataNs
        }).init(function($elt, $target) {
            var options = {
                target: $target,
                bindEvent: false
            };
            if($elt.data('width')){
                options.width = $elt.data('width');
            }
            $elt.inplacer(options);
        }).trigger(function($elt) {
            $elt.inplacer('toggle');
        });
    };
});

