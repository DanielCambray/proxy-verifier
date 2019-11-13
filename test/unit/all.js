'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var ProxyVerifier = require('../../');
var helpers = require('../helpers');

describe.only('testAll(proxy[, options], cb)', function() {

	var appServer;
	before(function(done) {
		appServer = helpers.createAppServer(3001, '127.0.0.1');
		ProxyVerifier.createSecureTunnel(3001, function(error, secureTunnelUrl) {
			if (error) return done(error);
			appServer.url = secureTunnelUrl;
			done();
		});
	});

	after(function() {
		appServer.http.close();
		appServer.https.close();
	});

	it('should be a function', function() {
		expect(ProxyVerifier.testAll).to.be.a('function');
	});

	describe('good proxy', function() {

		var proxyProtocols = ['http'];
		var proxyServer;

		before(function() {
			proxyServer = helpers.createProxyServer(5050, '127.0.0.2');
		});

		after(function() {
			proxyServer.close();
			proxyServer.http.close();
			proxyServer.https.close();
		});

		_.each(proxyProtocols, function(proxyProtocol) {

			it(proxyProtocol, function(done) {

				var proxy = {
					ipAddress: proxyServer[proxyProtocol].address().address,
					port: proxyServer[proxyProtocol].address().port,
					protocols: [proxyProtocol]
				};

				var options = {
					testUrl: 'https://127.0.0.1:3002/check',
					ipAddressCheckUrl: appServer.url + '/check',
					requestOptions: {
						strictSSL: false,
						agentOptions: {
							rejectUnauthorized: false
						},
						timeout: 100
					}
				};

				ProxyVerifier.testAll(proxy, options, function(error, result) {

					try {
						expect(error).to.equal(null);
						expect(result).to.be.an('object');
						expect(result.anonymityLevel).to.equal('elite');
						expect(result.tunnel).to.be.an('object');
						expect(result.tunnel.ok).to.equal(true);
						expect(result.protocols).to.be.an('object');
						expect(result.protocols[proxyProtocol]).to.be.an('object');
						expect(result.protocols[proxyProtocol].ok).to.equal(true);
					} catch (error) {
						return done(error);
					}

					done();
				});
			});
		});
	});
});
