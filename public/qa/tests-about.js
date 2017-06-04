suite('"about" page Test',function(){
    test('page shoule contain a contact page',function(){
        assert($('a[href = "/contact"]').length);
    });
});