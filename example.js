#!/usr/bin/env node

var net = require("net"),
    http = require("http"),
    httppp = require("./");

var server1_port = null,
    server2_port = null;

var proxy = net.createServer(function(socket) {
  var parser = new httppp.Parser();

  socket.pipe(parser);

  parser.on("error", function() {
    socket.end();
  });

  parser.on("headers", function(info) {
    console.log(new Date(), "proxy headers", info[0], info[1]);

    var host = (info[2].host && info[2].host.length) ? info[2].host[0] : null;

    // remove port from host header
    if (host) {
      host = host.split(":").shift();
    }

    switch (host) {
      case "localhost": parser.pipe(net.connect({port: server1_port})).pipe(socket); break;
      case "127.0.0.1": parser.pipe(net.connect({port: server2_port})).pipe(socket); break;
      default: socket.end(); break;
    }
  });
});

proxy.listen(3000, function() {
  console.log("listening on port", this.address().port);
});

var server1 = http.createServer(function(req, res) {
  console.log(new Date(), "http[1] request", req.url);

  res.end("hello there from server 1!");
});

server1.listen(function() {
  server1_port = this.address().port;
});

var server2 = http.createServer(function(req, res) {
  console.log(new Date(), "http[2] request", req.url);

  res.end("hello there from server 2!");
});

server2.listen(function() {
  server2_port = this.address().port;
});
