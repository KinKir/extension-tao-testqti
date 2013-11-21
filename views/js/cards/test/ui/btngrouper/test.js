define(['jquery', 'cards/cards', 'cards/ui/btngrouper'], function($, cards, btngrouper){
    
    
    module('Button Grouper Stand Alone Test');
   
    test('plugin', function(){
       expect(1);
       ok(typeof $.fn.btngrouper === 'function', 'The Button Grouper plugin is registered');
    });
   
    asyncTest('Initialization', function(){
        expect(2);
        
        var $fixture = $('#qunit-fixture');
        
        var $group = $("[data-button-group='toggle']", $fixture);
        ok($group.length === 1, 'The Group is available');
        
        $group.on('create.btngrouper', function(){
            ok(typeof $group.data('cards.btngrouper') === 'object', 'The element is runing the plugin');
            start();
        });
        $group.btngrouper({
            action : 'toggle'
        });
    });
    
    asyncTest('Toggle', function(){
        expect(4);
        
        var $fixture = $('#qunit-fixture');
        
        var $group = $("[data-button-group='toggle']", $fixture);
        ok($group.length === 1, 'The Group is available');
        
        $group.on('create.btngrouper', function(){
            $group.find('a:first').trigger('click');
            equal($group.find('.active').length, 1, 'Only one element is active');
        });
        $group.on('toggle.btngrouper', function(){
            equal($group.find('.active').length, 1, 'Only one element is active');
            ok($group.find('a:last').hasClass('active'), 'The active element is toggled');
            start();
        });
        $group.btngrouper({
            action : 'toggle'
        });
    });
    
    asyncTest('switch', function(){
        expect(3);
        
        var $fixture = $('#qunit-fixture');
        
        var $group = $("[data-button-group='switch']", $fixture);
        ok($group.length === 1, 'The Group is available');
        ok($group.find('a:first').hasClass('active'), 'The first element is active');
        
        $group.on('create.btngrouper', function(){
            $group.find('a:first').trigger('click');
        });
        $group.on('switch.btngrouper', function(){
            equal($group.find('.active').length, 0, 'No more element are active');
            start();
        });
        $group.btngrouper({
            action : 'switch'
        });
    });
    
    module('Button Grouper Data Attr Test');
     
     asyncTest('initialization', function(){
        expect(3);
        
        var $fixture = $('#qunit-fixture');
        
        var $group = $("[data-button-group='toggle']", $fixture);
        ok($group.length === 1, 'The Group is available');
        
        $group.on('toggle.btngrouper', function(){
            equal($group.find('.active').length, 1, 'Only one element is active');
            ok($group.find('a:last').hasClass('active'), 'The active element is toggled');
            start();
        });
       
        btngrouper($fixture);
        $group.find('a:last').trigger('click');
    });
    
});


