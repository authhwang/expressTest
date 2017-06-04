suite('global-test',function(){
    test('every page should have vaild title' ,function(){
         assert(document.title && document.title.match(/\S/) &&  document.title.toUpperCase() !== 'TODO',"好像漏了骚东西");
    });
});