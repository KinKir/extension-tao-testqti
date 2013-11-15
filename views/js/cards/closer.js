/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires cards/core/pluginifier
 * @requires cards/core/dataattrhandler
 */
define(['jquery', 'lodash', 'cards/core/pluginifier', 'cards/core/dataattrhandler'], function($, _, Pluginifier, DataAttrHandler){
   'use strict';
   
   var ns = 'closer';
   var dataNs = 'cards.' + ns;
   
   var defaults = {
       bindEvent : 'click',
       confirm : true,
       confirmMessage : 'Are you sure you want to close it?'
   };
   
   /** 
    * The Closer component, that helps you to close a new element.
    * @exports cards/closer
    */
   var Closer = {
       
        /**
         * Initialize the plugin.
         * 
         * Called the jQuery way once registered by the Pluginifier.
         * @example $('selector').closer({target : $('target')});
         * @public
         * 
         * @constructor
         * @param {Object} options - the plugin options
         * @param {jQueryElement} options.target - the element to close
         * @param {string|boolean} [options.bindEvent = 'click'] - the event that trigger the close
         * @param {boolean} [options.confirm = true] - diplay a popup to confirm the closing
         * @param {string} [optionsconfirmMessage = '...'] - the confirmation message
         * @fires Closer#create.closer
         * @returns {jQueryElement} for chaining
         */
        init : function(options){
            options = _.defaults(options, defaults);
           
            return this.each(function() {
                var $elt = $(this);
                
                //add data to the element
                $elt.data(dataNs, options);
                
                 //bind an event to trigger the close
                if(options.bindEvent !== false){
                    $elt.on(options.bindEvent, function(e){
                        e.preventDefault();
                         Closer._close($elt);
                     });
                }

                /**
                 * The plugin have been created.
                 * @event Closer#create.closer
                 */
                $elt.trigger('create.' + ns);
            });
       },
       
       /**
        * Trigger the close. 
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').closer('close');
        * @public
        * 
        * @returns {jQueryElement} for chaining
        */
       close : function(){
           this.each(function() {
                Closer._close($(this));
           });
       },
               
       /**
        * Internal close mechanism.
        * 
        * @private
        * @param {jQueryElement} $elt - plugin's element 
        * @fires Closer#close.closer
        * @fires close
        */
       _close : function($elt){
           var options = $elt.data(dataNs);
           var $target = options.target;
           var close = true;
           
           if(options.confirm === true){
               close = confirm(options.confirmMessage);
           }
           if(close){
               
               /**
                 * The plugin have been closed/removed. 
                 * Those eventes are fired just before the removal 
                 * to be able to listen them 
                 * (if $elt is inside the closed elt for instance)
                 * @event Closer#close.closer
                 * @param {jQueryElement} $target - the element being closed/removed
                 */
               $elt.trigger('close.'+ ns, [$target]);
               $target.trigger('close');            //global event for consistensy
               
               $target.remove();
           }
       },
               
       /**
        * Destroy completely the plugin.
        * 
        * Called the jQuery way once registered by the Pluginifier.
        * @example $('selector').closer('destroy');
        * @public
        * @fires Closer#destroy.closer
        */
       destroy : function(){
            this.each(function() {
                var $elt = $(this);
                var options = $elt.data(dataNs);
                if(options.bindEvent !== false){
                    $elt.off(options.bindEvent);
                }
                
                /**
                 * The plugin have been destroyed.
                 * @event Closer#destroy.closer
                 */
                $elt.trigger('destroy.' + ns);
            });
        }
   };
   
   //Register the toggler to behave as a jQuery plugin.
   Pluginifier.register(ns, Closer);
   
   /**
    * The only exposed function is used to start listening on data-attr
    * 
    * @public
    * @example define(['cards/closer'], function(closer){ closer($('rootContainer')); });
    * @param {jQueryElement} $container - the root context to listen in
    */
   return function listenDataAttr($container){
       
        new DataAttrHandler('close', {
            container: $container,
            listenerEvent: 'click',
            namespace: dataNs
        }).init(function($elt, $target) {
            $elt.closer({
                target: $target,
                bindEvent: false
            });
        }).trigger(function($elt) {
            $elt.closer('close');
        });
    };
});

