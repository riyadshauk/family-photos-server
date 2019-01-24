const expect = require('chai').expect;
const axios = require('axios');

const constants = require('./helpers/constants');

describe(`Simple webserver black-box tests`, () => {

  describe(`Logging in`, () => {
    it(`should send 401 Unauthorized status code when authorization header is missing`, (done) => {
      axios({
        method: 'post',
        url: `http://localhost:${constants.port}/login`
      }).then((res) => {
        expect(res.status === 401 && false);
        done();
      }).catch((err) => {
        expect(err);
        done();
      });
    });
    it(`should send 401 Unauthorized status code when invalid username-password pair correctly provided`, (done) => {
      axios({
        method: 'post',
        url: `http://localhost:${constants.port}/login`,
        auth: {
          username: 'invalid-username' + Math.random(),
          password: 'some-invalid-password' + Math.random(),
        },
      }).then((res) => {
        expect(res.status === 401 && false);
        done();
      }).catch((err) => {
        expect(err);
        done();
      });
    });
    it(`should send 200 OK status code when valid username-password pair correctly provided`, (done) => {
      axios({
        method: 'post',
        url: `http://localhost:${constants.port}/login`,
        auth: {
          username: constants.test.user,
          password: constants.test.passwordHash,
        },
      }).then((res) => {
        expect(res.status === 200);
        done();
      }).catch((err) => {
        expect(false);
        done();
      });
    });
  });

  describe(`Protected Routes & Bearer Token Authentication (via 'sample-photos' static folder)`, () => {

    describe(`Protecting 'photos' route`, () => {
      it(`should send 401 Unauthorized status code when no authorization header provided`, (done) => {
        axios.get(
          `http://localhost:${constants.port}/photos/demo`
        ).then((res) => {
          expect(res.status === 401);
          done();
        }).catch((err) => {
          expect(err);
          done();
        });
      });
      it(`should send 401 Unauthorized status code when empty token provided`, (done) => {
        axios.get(
          `http://localhost:${constants.port}/photos/demo`,
          { headers: { 'Authorization': `Bearer ` } }
        ).then((res) => {
          expect(res.status === 401);
          done();
        }).catch((err) => {
          expect(err);
          done();
        });
      });
      it(`should send 401 Unauthorized status code when invalid token provided`, (done) => {
        axios.get(
          `http://localhost:${constants.port}/photos/demo`,
          { headers: { 'Authorization': `Bearer this-is-an-invalid-token` } }
        ).then((res) => {
          expect(res.status === 401);
          done();
        }).catch((err) => {
          expect(err);
          done();
        });
      });
      it(`should send 403 Forbidden status code when valid token provided for non-{jpeg,video} (ie: .txt) file`, (done) => {
        axios({
          method: 'post',
          url: `http://localhost:${constants.port}/login`,
          auth: {
            username: constants.test.user,
            password: constants.test.passwordHash,
          },
        })
        .then((res) => {
          const token = res.data ? res.data.token : '';
          axios.get(
            `http://localhost:${constants.port}/photos/demo/helloworld.txt`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          ).then((res) => {
            expect(false);
            done();
          }).catch((err) => {
            expect(err.response.status === 403);
            done();
          });
        }).catch((err) => {
          expect(false);
          done(err.stack);
        });
      });
      it(`should send 404 Not Found status code when valid token provided for non-existant jpg file`, (done) => {
        axios({
          method: 'post',
          url: `http://localhost:${constants.port}/login`,
          auth: {
            username: constants.test.user,
            password: constants.test.passwordHash,
          },
        })
        .then((res) => {
          const token = res.data ? res.data.token : '';
          axios.get(
            `http://localhost:${constants.port}/photos/demo/blah${Math.random()}.JPG`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          ).then((res) => {
            expect(false);
            done();
          }).catch((err) => {
            expect(err.response.status === 404);
            done();
          });
        }).catch((err) => {
          expect(false);
          done(err.stack);
        });
      });
      it(`should send 200 OK status code when valid token provided (in request header) for jpg file`, (done) => {
        axios({
          method: 'post',
          url: `http://localhost:${constants.port}/login`,
          auth: {
            username: constants.test.user,
            password: constants.test.passwordHash,
          },
        })
        .then((res) => {
          const token = res.data ? res.data.token : '';
          const status = res.status;
          axios.get(
            `http://localhost:${constants.port}/photos/demo/test.JPG`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          ).then((res) => {
            expect(res.status === 200);
            done();
          });
        }).catch((err) => {
          expect(false);
          done(err.stack);
        });
      });
      it(`should send 200 OK status code when valid token provided (in query parameter named "token") for jpg file`, (done) => {
        axios({
          method: 'post',
          url: `http://localhost:${constants.port}/login`,
          auth: {
            username: constants.test.user,
            password: constants.test.passwordHash,
          },
        })
        .then((res) => {
          const token = res.data ? res.data.token : '';
          const status = res.status;
          axios.get(
            `http://localhost:${constants.port}/photos/demo/test.JPG?token=${token}`,
          ).then((res) => {
            expect(res.status === 200);
            done();
          });
        }).catch((err) => {
          expect(false);
          done(err.stack);
        });
      });
      it(`should send 403 Forbidden status code when valid token provided but attempting to access parent directory in filesystem`, (done) => {
        axios({
          method: 'post',
          url: `http://localhost:${constants.port}/login`,
          auth: {
            username: constants.test.user,
            password: constants.test.passwordHash,
          },
        })
        .then((res) => {
          const token = res.data ? res.data.token : '';
          const status = res.status;
          axios.get(
            `http://localhost:${constants.port}/photos/demo/../test.JPG?token=${token}`,
          ).then((res) => {
            expect(false);
            done(new Error().stack);
          }).catch((err) => {
            expect(err.response.status === 403);
            done();
          });
        }).catch((err) => {
          expect(false);
          done(err.stack);
        });
      });
    });

  });
});