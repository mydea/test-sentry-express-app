const http = require('http');
const express = require("express");

function runApp(Sentry, callback) { 
  const app = express();

  const port = 3000;

  if (callback) {
    callback(app);
  }

  function makeRequest(url) {
    return new Promise((resolve) => {
      http.request(url, (httpRes) => {
        httpRes.on('data', () => {});
        httpRes.on('end', () => {
        resolve();
        });
      }).end();
    });
  }

  app.get("/test", function (req, res) {
    http.request('http://example.com?what=true#hahaha', (httpRes) => {
      httpRes.on('data', () => {});
      httpRes.on('end', (d) => {
        res.send({ version: "v2" });
      });
    }).end();
  });

  app.get("/parallel", (request, reply) => {
    const id = Math.floor(Math.random() * 1000000);
    console.log(`parallel request ${id}`);

    Sentry.withScope((scope) => {
      scope.setTag("parallel-outer", `${id}`);
      scope.setUser({id: `user-${id}`, email: 'test@example.com' });
      console.log('outer scope', scope._tags)

      setTimeout(() => {
        makeRequest(`http://example.com/${id}`).then(() => {
          Sentry.withScope((innerScope) => {
            innerScope.setTag("parallel-inner", `${id}`);
            innerScope.setTag(`parallel-inner-${id}`, `${id}`);

            console.log("inner scope", innerScope._tags);

            Sentry.captureException(new Error(`parallel error ${id}`));
            reply.send({ hello: "world", status: 'OK', id });
          })
        })
      }, 5000);
    });
  });

  app.get("/test-2", function (req, res) {
    http.request('http://localhost:3000/test-3', (httpRes) => {
      httpRes.on('data', () => {});
      httpRes.on('end', (d) => {
        res.send({ other: 123 });
      });
    }).end();
  });

  app.get("/test-3", function (req, res) {
    res.send({ other: 123 });
  });

  app.get("/test-param/:param", function (req, res) {
    res.send({ paramWas: req.params.param });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  return app;
}

module.exports = { runApp };