/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires lodash
 * @requires handlebars
 * @requires cards/core/encoder/encoders
 */
define(
['jquery', 'lodash', 'handlebars', 'cards/core/encoder/encoders', 'cards/core/filter/filters'], 
function($, _, Handlebars, Encoders, Filters){
    'use strict';
    
    /**
     * Get the value of a property defined by the path into the object
     * @param {Object} obj - the object to locate property into
     * @param {string} path - the property path 
     * @returns {*}
     */
    var locate = function locate(obj, path) {
        var nodes = path.split('.');
        var size = nodes.length;
        var i = 1;
        var result;

        if (size >= 1) {
            result = obj[nodes[0]];
            if (result !== undefined) {
                for (i = 1; i < size; i++) {
                    result = result[nodes[i]];
                    if (result === undefined) {
                        break;
                    }
                }
            }
        }
        return result;
    };

    /**
     * Set the value of a property defined by the path into the object
     * @param {Object} obj - the object to locate property into
     * @param {string} path - the property path
     * @param {string|boolean|number} value - the value to assign
     */
    var update = function update(obj, path, value) {
        var nodes = path.split('.');
        var size = nodes.length;
        for (var i = 0; i < size; i++) {
            if (i === (size - 1)) {
                obj[nodes[i]] = value;
                return;
            } else {
                if (!obj[nodes[i]]) {
                    obj[nodes[i]] = {};    //check if this fits arrays
                }
                obj = obj[nodes[i]];
            }
        }
    };
    
    /**
     * Removes the property from the object
     * @param {Object} obj - the object to locate property into
     * @param {string} path - the property path
     */
    var remove = function remove(obj, path) {
        var nodes = path.split('.');
        var size = nodes.length;
        for (var i = 0; i < size; i++) {
            if (i === (size - 1)) {
                if(_.isArray(obj)){
                    obj.splice(parseInt(nodes[i], 10), 1);
                } else {
                    delete obj[nodes[i]];
                }
                return;
            } else {
                obj = obj[nodes[i]];
            }
        }
    };
    
    /**
     * Sort a property array in the object 
     * regarding the ordered defined into the nodes (using the data-bind-index attribute).
     * @param {Object} obj - the object to locate property into
     * @param {string} path - the property path
     * @param {jQueryElement} $node - the element that contains the items
     */
    var order =  function order(obj, path, $node){
        var values = locate(obj, path);
        var changed = false;
        if(_.isArray(values)){
            
            $node.children('[data-bind-index]').each(function(position){
                var $item = $(this);
                var index = parseInt($item.data('bind-index'), 10);
                values[index].index = position;
                changed = (changed || position !== index);
            });
            
            if(changed === true){
                values.sort(function(a, b){
                    return a.index - b.index;
                });
            }
        }
    };
    
    /**
     * Synchronize indexes of a property array in the object 
     * regarding the ordered defined into the nodes (using the data-bind-index attribute).
     * @param {Object} obj - the object to locate property into
     * @param {string} path - the property path
     * @param {jQueryElement} $node - the element that contains the items
     */
    var resyncIndexes = function resyncIndexes(obj, path, $node){
        
        var values = locate(obj, path);
        if(_.isArray(values)){
       
            _.forEach(values, function(value, position){
                values[position].index = position;
                if($node){
                    $node.children('[data-bind-index]').eq(position)
                            .attr('data-bind-index', position + '')
                            .data('bind-index', position + '');
                }
            });
        }
    };

    /**
     * For radio and checkbox, the element that listen for events is the group and not the single node.
     * It enables you to get the right element(s).
     * 
     * @param {jQueryElement} $node
     * @returns {jQueryElement}
     */
    var toBind = function toBind($node) {
        if ($node.is(':radio') && $node.attr('name')) {
            return $(":radio[name='" + $node.attr('name') + "']");
        } else if ($node.is(':checkbox')  && $node.attr('name')) {
            return $(":checkbox[name='" + $node.attr('name') + "']");
        }
        return $node;
    };
    
    var bindDefault = {
        domFirst : false,
        rebind : false
    };
    
        
    /**
     * Constructor, define the model and the DOM container to bind
     * @exports cards/core/DataBinder
     * @constructs
     * @param {jQueryElement} $container
     * @param {Object} model
     * @returns {DataBinder}
     */
    var DataBinder = function DataBinder($container, model, options) {
        var self = this;
        this.$container = $container;
        this.model = model || {};
        this.encoders = _.clone(Encoders);
        this.filters = _.clone(Filters);
        
        if(options){
            if(_.isPlainObject(options.encoders)){
                _.forEach(options.encoders, function(encoder, name){
                    self.encoders.register(name, encoder.encode, encoder.decode);
                });
            }
            if(_.isPlainObject(options.filters)){
                _.forEach(options.filters, function(filter, name){
                    self.filters.register(name, filter);
                });
            }
        }
    };

    /**
     * Assign value and listen for change on a particular node.
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the elements to bind 
     * @param {string} path - the path to the model value to bind
     * @param {Object} model - the model bound
     * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
     */
    DataBinder.prototype._bindNode = function _bindNode($node, path, model, domFirst) {
        if(!$node.data('bound')){
            if(domFirst === true){
                  update(model, path, this._getNodeValue($node));
            }

            this._setNodeValue($node, locate(model, path));

            this._listenUpdates($node, path, model);
            this._listenRemoves($node, path, model);
            
            $node.data('bound', path);
        }
    };
    
    /**
     * Bind array value to a node.
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the elements to bind 
     * @param {string} path - the path to the model value to bind
     * @param {Object} model - the model bound
     * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
     */
    DataBinder.prototype._bindArrayNode = function _bindArrayNode($node, path, model, domFirst) {
        
        var self = this;
        if(!$node.data('bound')){
            var template;
            var values = locate(model, path);
            
            //the item content is either defined by an external template or as the node content
            if($node.data('bind-tmpl')){
                template = Handlebars.compile($($node.data('bind-tmpl')).html());
            } else {
                 template = Handlebars.compile($node.html());
            }


            if(!values || !_.isArray(values)){
                 //create the array in the model if not exists
                 update(model, path, []);
             } else if($node.data('bind-filter')) {
                 //apply filtering
                 values = this.filters.filter($node.data('bind-filter'), values);
             }

             $node.empty();
             
             _.forEach(values, function(value, index){
                var $newNode;
                
                value.index = index;                        //the model as an index property, used for reordering 
                $newNode = $(template(value));
                $newNode
                     .appendTo($node)
                     .filter(':first')
                     .attr('data-bind-index', index);    //we add the index to the 1st inserted node to keep it in sync
                
                //bind the content of the inserted nodes
                self.bind($newNode, self.model, path + '.' + index + '.', domFirst);
                
                 //listen for removal on the item node
                self._listenRemoves($newNode, path + '.' + index, self.model);
             });
             
             //listen for reordering and item addition on the list node
             self._listenUpdates($node, path, model);
             self._listenAdds($node, path, model);
             
              $node.data('bound', path);
        }
    };
    
    /**
     * Listen for updates on a particular node. (listening the 'change' event)
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the elements to bind 
     * @param {string} path - the path to the model value to bind
     * @param {Object} model - the model bound
     * @fires DataBinder#update.binder
     * @fires DataBinder#change.binder
     */
    DataBinder.prototype._listenUpdates = function _listenUpdates($node, path, model) {
        
        var self = this;
        toBind($node).off('change').on('change', function(e) {
            e.stopPropagation();
            
            if($node.is('[data-bind-each]')){
                 order(model, path, $node);
                 resyncIndexes(model, path, $node);
                 
                 $node.data('bind-each', path);
                 self._rebind($node);
                 
                 self.$container.trigger('order.binder', [self.model]);
            } else {
                update(model, path, self._getNodeValue($node));
                
                /**
                * The model has been updated
                * @event DataBinder#update.binder
                * @param {Object} model - the up to date model
                */
                self.$container.trigger('change.binder', [self.model]);
            }

            
            /**
             * The model has changed (update, add or remove)
             * @event DataBinder#change.binder
             * @param {Object} model - the up to date model
             */
             self.$container.trigger('change.binder', [self.model]);

            
        });
    };
    
     /**
     * Listen for node removal on a bound array. (listening the 'remove' event)
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the elements to bind 
     * @param {string} path - the path to the model value to bind
     * @param {Object} model - the model bound
     * @fires DataBinder#delete.binder
     * @fires DataBinder#change.binder
     */
    DataBinder.prototype._listenRemoves = function _listenRemoves($node, path, model) {
        
        var self = this;
        toBind($node).off('close').on('close', function(e){
            e.stopPropagation();

            remove(model, path);
            
            if ($node.is('[data-bind-index]')) {
                var removedIndex = parseInt($node.data('bind-index'), 10);
                var $parentNode = $node.parent('[data-bind-each]');
                var parentPath = path.replace(/\.[0-9]+$/, '');

                resyncIndexes(self.model, parentPath);

                //we need to rebind after sync because the path are not valid anymore
                $parentNode.children('[data-bind-index]').filter(':gt(' + removedIndex + ')').each(function() {
                    var $item = $(this);
                    var newIndex = parseInt($item.data('bind-index'), 10) - 1;
                    //we also update the indexes
                    $item.attr('data-bind-index', newIndex)
                            .data('bind-index', newIndex + '');
                });
            }

            /**
             * An property of the model is removed
             * @event DataBinder#delete.binder
             * @param {Object} model - the up to date model
             */
            self.$container
                    .trigger('delete.binder', [self.model])
                    .trigger('change.binder', [self.model]);

        });
    };
    
     /**
     * Listen for node addition on a bound array. (listening the 'add' event)
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the elements to bind 
     * @param {string} path - the path to the model value to bind
     * @param {Object} model - the model bound
     * @fires DataBinder#add.binder
     * @fires DataBinder#change.binder
     */
    DataBinder.prototype._listenAdds = function _listenAdds($node, path, model) {
        
        var self = this;
        toBind($node).off('add').on('add', function(e, data){
            e.stopPropagation();
            
            var size = $node.children('[data-bind-index]').length;
            $node.children().not('[data-bind-index]').each(function(){
                //got the inserted node
                var $newNode = $(this);
                var realPath = path + '.' + size;
                $newNode.attr('data-bind-index', size);
                
                if(data){
                    //if data is given through the event, we use it ti create the value 
                    //(if the same value is set through the dom, it will override it cf. domFirst)
                    update(self.model, realPath, data);
                }
                
                //bind the node and it's content using the domFirst approach (to create the related model)
                self.bind($newNode, self.model, realPath + '.', true);
                self._listenRemoves($newNode, realPath, self.model);
            });

            /**
             * The model contains a new property
             * @event DataBinder#add.binder
             * @param {Object} model - the up to date model
             */
            self.$container
                    .trigger('add.binder', [self.model])
                    .trigger('change.binder', [self.model]);
        });
    };
    
        /**
     * Set the value into a node.
     * If an encoder is defined in the node, the encode method is called.
     * 
     * @param {jQueryElement} $node - the node that accept the value
     * @param {string|boolean|number} value - the value to set
     */
    DataBinder.prototype._setNodeValue = function _setNodeValue($node, value) {
        if (value !== undefined) {
            
             //decode value
            if ($node.data('bind-encoder')) {
                 value = this.encoders.encode($node.data('bind-encoder'), value);
            }

            //assign value
            if ($node.is(':text, textarea')) {
                $node.val(value);
            } else if ($node.is(':radio, :checkbox')) {
                $node.prop('checked', ($node.val() === value));
            } else {
                $node.text(value);
            }
        }
    };

    /**
     * Set the value from a node.
     * If an encoder is defined in the node, the decode method is called.
     * @memberOf DataBinder
     * @private
     * @param {jQueryElement} $node - the node to get the value from
     * @returns {string|boolean|number} value - the value to set
     */
    DataBinder.prototype._getNodeValue = function _getNodeValue($node) {
        var value;
        if ($node.is(':text, textarea')) {
            value = $node.val();
        } else if ($node.is(':radio, :checkbox')) {
            value = toBind($node).filter(':checked').val();
        } else {
            value = $node.text();
        }

        //decode value
        if ($node.data('bind-encoder')) {
           value = this.encoders.decode($node.data('bind-encoder'), value);
        }

        return value;
    };
    
     /**
     * Start the binding!
     * @memberOf DataBinder
     * @public
     * @param {jQueryElement} $elt - the container of the elements to bind (also itself boundable)
     * @param {Object} model - the model to bind
     * @param {string} [prefix = ''] - a prefix into the model path, used internally on rebound
     * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
     */
    DataBinder.prototype.bind = function bind($elt, model, prefix, domFirst) {
        var self = this;
        
        $elt = $elt || self.$container;
        model = model || self.model;
        prefix = prefix || '';
        domFirst = domFirst || false;
        
        //Array binding
        $elt.find('[data-bind-each]').andSelf().filter('[data-bind-each]').each(function(){
             var $node = $(this);
             var path = prefix + $node.data('bind-each');
             self._bindArrayNode($node, path, model, domFirst);
         });
         
         //simpple binding (the container can also bound something in addition to children) 
        $elt.find('[data-bind]').andSelf().filter('[data-bind]').each(function() {
            var $node = $(this);
            var path = prefix + $node.data('bind');
            self._bindNode($node, path, model, domFirst);
        });
    };
    
     DataBinder.prototype._rebind = function _rebind($elt, prefix){
         
        var self = this;
        prefix = prefix || '';
        
        if( $elt.is('[data-bind-each]')){
             var path = prefix + $elt.data('bind-each');
             var values = locate(self.model, path);
            
             _.forEach(values, function(value, index){
                var $childNode = $elt.children('[data-bind-index="' + index + '"]');
                
                self._rebind($childNode, path + '.' + index + '.');
                
                self._listenRemoves($childNode, path + '.' + index, self.model);
             });
             
             //listen for reordering and item addition on the list node
             self._listenUpdates($elt, path, self.model);
             self._listenAdds($elt, path, self.model);
             
         } else {
             $elt.find('[data-bind]').each(function(){
                    var $node = $(this);
                    var path =  prefix + $node.data('bind');

                    self._listenUpdates($node, path, self.model);
                    self._listenRemoves($node, path, self.model);
                });
             $elt.find('[data-bind-each]').each(function(){
                    self._rebind($(this), prefix);
                });
         }
         
     };
   
    //only the DataBinder is exposed
    return DataBinder;
});


