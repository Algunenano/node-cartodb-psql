var _      = require('underscore'),
    assert = require('assert'),
    PSQL   = require('../../lib/psql'),
    setup  = require('../setup');

var public_user = global.settings.db_pubuser;

var dbopts_auth = {
    host: global.settings.db_host,
    port: global.settings.db_port,
    user: _.template(global.settings.db_user, {user_id: 1}),
    dbname: _.template(global.settings.db_base_name, {user_id: 1}),
    pass: _.template(global.settings.db_user_pass, {user_id: 1})
};

var dbopts_anon = _.clone(dbopts_auth);
dbopts_anon.user = global.settings.db_pubuser;
dbopts_anon.pass = global.settings.db_pubuser_pass;


suite('psql', function() {

    test('test private user can execute SELECTS on db', function(done){
        var pg = new PSQL(dbopts_auth);
        var sql = "SELECT 1 as test_sum";
        pg.query(sql, function(err, result){
            assert.ok(!err, err);
            assert.equal(result.rows[0].test_sum, 1);
            done();
        });
    });

    test('test private user can execute CREATE on db', function(done){
        var pg = new PSQL(dbopts_auth);
        var sql = "DROP TABLE IF EXISTS distributors; CREATE TABLE distributors (id integer, name varchar(40), UNIQUE(name))";
        pg.query(sql, function(err/*, result*/){
            assert.ok(_.isNull(err));
            done();
        });
    });

    test('test private user can execute INSERT on db', function(done){
        var pg = new PSQL(dbopts_auth);
        var sql = "DROP TABLE IF EXISTS distributors1; CREATE TABLE distributors1 (id integer, name varchar(40), UNIQUE(name))";
        pg.query(sql, function(/*err, result*/){
            sql = "INSERT INTO distributors1 (id, name) VALUES (1, 'fish')";
            pg.query(sql,function(err, result){
                assert.deepEqual(result.rows, []);
                done();
            });
        });
    });

    test('test public user can execute SELECT on enabled tables', function(done){
        var pg = new PSQL(dbopts_auth);
        var sql = "DROP TABLE IF EXISTS distributors2; CREATE TABLE distributors2 (id integer, name varchar(40), UNIQUE(name)); GRANT SELECT ON distributors2 TO " + public_user + ";";
        pg.query(sql, function(/*err, result*/){
            pg = new PSQL(dbopts_anon);
            pg.query("SELECT count(*) FROM distributors2", function(err, result){
                assert.equal(result.rows[0].count, 0);
                done();
            });
        });
    });

    test('test public user cannot execute INSERT on db', function(done){
        var pg = new PSQL(dbopts_auth);
        var sql = "DROP TABLE IF EXISTS distributors3; CREATE TABLE distributors3 (id integer, name varchar(40), UNIQUE(name)); GRANT SELECT ON distributors3 TO " + public_user + ";";
        pg.query(sql, function(/*err, result*/){

            pg = new PSQL(dbopts_anon);
            pg.query("INSERT INTO distributors3 (id, name) VALUES (1, 'fishy')", function(err/*, result*/){
                assert.equal(err.message, 'permission denied for relation distributors3');
                done();
            });
        });
    });

    test('eventedQuery provisions a cancel mechanism to abort queries', function (done) {
        var psql = new PSQL(dbopts_auth);
        psql.eventedQuery("SELECT 1 as foo", function(err, query, queryCanceller) {
            assert.ok(_.isFunction(queryCanceller));
            done();
        });
    });
});
