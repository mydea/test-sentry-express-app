const http = require('http');
const express = require("express");
const mysql = require('mysql');

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

      makeRequest(`http://example.com/${id}`).then(() => {
        Sentry.withScope((innerScope) => {
          innerScope.setTag("parallel-inner", `${id}`);
          innerScope.setTag(`parallel-inner-${id}`, `${id}`);

          console.log("inner scope", innerScope._tags);

          reply.send({ hello: "world", status: 'OK', id });
        })
      });
    });
});

  app.get("/parallel-error", (request, reply) => {
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

  app.get("/parallel-timeout", (request, reply) => {
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

  app.get("/test-mysql",async  function (req, res) {
    const connection =  mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'test-app',
      password: 'password'
    });

    const sortedMovies = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT title FROM `movies` ORDER BY title asc',
        function (error, results) {
          if (error) {
            return reject(error);
          }

          resolve(results);
        }
      );
    });

    const moveTitles = sortedMovies.map((movie) => movie.title);

    const movies = [];

    for (const title of moveTitles) {
      movies.push(...(await getMovies(connection, title)));
    }


    connection.end();

    res.send({ movies });
  });

  app.get("/test-nested",async  function (req, res) {
    for(let i = 0; i < 10; i++) {
      await makeRequest(`http://localhost:3000/test-param/${i}`);
    }

    res.send({ completed: 'all' });
  });

  app.get("/test-param/:param", function (req, res) {
    res.send({ paramWas: req.params.param });
  });

  app.get('/test-manual-instrumentation', function (req, res)  {
    Sentry.startActiveSpan({description: 'test-manual-instrumentation'}, async () => {
      const span = Sentry.startSpan({description: 'test-manual-instrumentation-2'});
      await makeRequest(`http://localhost:3000/test-param/0`);
      span.finish();

      const span2 = Sentry.startSpan({description: 'test-manual-instrumentation-3'});
      span2.finish();
      res.send({ finished: 'all' });
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  return app;
}

function getMovies(connection, title) {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT *, SLEEP(0.1) FROM `movies` WHERE `title` = ?',
      [title],
      function (error, results) {
        if (error) {
          console.error(error);
          return reject(error);
        }

        resolve(results);
      }
    );
  });
}

module.exports = { runApp };