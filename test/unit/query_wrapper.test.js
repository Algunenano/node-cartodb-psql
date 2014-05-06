var _           = require('underscore'),
    assert      = require('assert'),
    QueryWrapper = require('../../lib/query_wrapper'),
    setup       = require('../setup');


// NOTE: intentionally mixed-case and space-padded
var simpleSql = "\n \tSEleCT * from table1";

suite('query_wrapper', function() {

    test('Windowed SQL with simple select', function(){
        var out = new QueryWrapper(simpleSql).window(1, 0).query();

        assert.equal(out, "SELECT * FROM (" + simpleSql + ") AS cdbq_1 LIMIT 1 OFFSET 0");
    });

    test('Windowed SQL with CTE select', function(){
        // NOTE: intentionally mixed-case and space-padded
        var cte = "\n \twiTh  x as( update test set x=x+1)";
        var select = "\n \tSEleCT * from x";
        var sql = cte + select;

        var out = new QueryWrapper(sql).window(1, 0).query();

        assert.equal(out, cte + "SELECT * FROM (" + select + ") AS cdbq_1 LIMIT 1 OFFSET 0");
    });

    test('Windowed SQL with CTE update', function(){
        // NOTE: intentionally mixed-case and space-padded
        var cte = "\n \twiTh  a as( update test set x=x+1)";
        var upd = "\n \tupdate tost set y=x from x";
        var sql = cte + upd;

        var out = new QueryWrapper(sql).window(1, 0).query();

        assert.equal(out, sql);
    });

    test('Windowed SQL with complex CTE and insane quoting', function(){
        // NOTE: intentionally mixed-case and space-padded
        var cte = "\n \twiTh \"('a\" as( update \"\"\"test)\" set x='x'+1), \")b(\" as ( select ')))\"' from z )";
        var sel = "\n \tselect '\"' from x";
        var sql = cte + sel;

        var out = new QueryWrapper(sql).window(1, 0).query();

        assert.equal(out, cte + "SELECT * FROM (" + sel + ") AS cdbq_1 LIMIT 1 OFFSET 0");
    });

    test('Different instances return different queries', function() {
        var aWrapper = new QueryWrapper('select 1');
        var bWrapper = new QueryWrapper('select * from databaseB');

        assert.notEqual(aWrapper, bWrapper);
        assert.notEqual(aWrapper.query(), bWrapper.query(), 'queries should be different');
    });

    test('Order by SQL with simple select and empty column name returns original query', function() {
        var expectedSql = simpleSql;

        var outputSql = new QueryWrapper(simpleSql).orderBy('').query();

        assert.equal(outputSql, expectedSql);
    });

    test('Order by SQL with simple select and no sort order', function() {
        var expectedSql = 'SELECT * FROM (' + simpleSql + ') AS cdbq_1 ORDER BY "foo"';

        var outputSql = new QueryWrapper(simpleSql).orderBy('foo').query();

        assert.equal(outputSql, expectedSql);
    });

    test('Order by SQL with simple select and invalid sort order use no sort order', function() {
        var expectedSql = 'SELECT * FROM (' + simpleSql + ') AS cdbq_1 ORDER BY "foo"';

        var outputSql = new QueryWrapper(simpleSql).orderBy('foo', "BAD_SORT_ORDER").query();

        assert.equal(outputSql, expectedSql);
    });

    test('Order by SQL with simple select and asc order', function() {
        var expectedSql = 'SELECT * FROM (' + simpleSql + ') AS cdbq_1 ORDER BY "foo" ASC';

        var outputSql = new QueryWrapper(simpleSql).orderBy('foo', "asc").query();

        assert.equal(outputSql, expectedSql);
    });

    test('Order by SQL with simple select and DESC order', function() {
        var expectedSql = 'SELECT * FROM (' + simpleSql + ') AS cdbq_1 ORDER BY "foo" DESC';

        var outputSql = new QueryWrapper(simpleSql).orderBy('foo', "DESC").query();

        assert.equal(outputSql, expectedSql);
    });

    test('Query with ending semicolon returns without it', function() {
        var expectedSql = 'select a, ( a - min(a) over() ) / ( ( max(a) over () - min(a) over () ) / 4 ) as interval from ( select test as a from quantile_test ) as f',
            query = expectedSql + ';';

        var outputSql = new QueryWrapper(query).query();

        assert.equal(outputSql, expectedSql);
    });

    test('Several queries with semicolon get only last semicolon removed', function() {
        var expectedSql = 'SELECT 1; SELECT 2; SELECT 3',
            query = expectedSql + ';';

        var outputSql = new QueryWrapper(query).query();

        assert.equal(outputSql, expectedSql);
    });
});
