// dependencies
import AsyncEmitter from 'carrack';
import { lookupSync } from 'climb-lookup';
import sinon from 'sinon';
import stripAnsi from 'strip-ansi';
import assert from 'power-assert';

// target
import Log from '../src';

// fixture
const createMockProcess = () => ({
  cwd: () => process.cwd(),
  exit: sinon.spy(),
  stdout: {
    write: sinon.spy(),
  },
});
const setupFixtures = () => {
  const emitter = new AsyncEmitter;
  const process = createMockProcess();
  const log = new Log(emitter, { process });

  emitter.packagePath = lookupSync('package.json');

  return { log, emitter, process };
};

// specs
describe('Log', () => {
  describe('.strong', () => {
    it('if first argument is array, should be join using second argument', () => {
      const output = stripAnsi(Log.strong(['foo', 'bar', 'baz'], '! '));
      assert(output === 'foo! bar! baz');
    });
  });

  describe('.statuses', () => {
    it('if second argument is 1, the first argument should be in the fail style', () => {
      assert(Log.statuses('kaboom', 1) === Log.fail('kaboom'));
      assert(Log.statuses('kaboom', 0) === Log.pass('kaboom'));
    });

    it('if specify first argument is array, should return the string', () => {
      const glue = '!!! ';
      const expectedCharacters = [
        Log.pass('a'),
        Log.fail('b'),
        Log.fail('c'),
      ].join(glue);

      assert.equal(
        Log.statuses(['a', 'b', 'c'], [0, 1, 2], glue),
        expectedCharacters,
      );
    });

    it('second argument should be omitted', () => {
      assert(Log.statuses(0) === Log.pass('0'));
      assert(Log.statuses(1) === Log.fail('1'));

      const glue = 'ಠ益ಠ';
      assert.deepEqual(
        Log.statuses([0, 1, 329108], null, glue),
        [
          Log.pass('0'),
          Log.fail('1'),
          Log.fail('329108'),
        ].join(glue),
      );
    });
  });

  describe('.format', () => {
    it('should return the elapsed time in the 7 characters', () => {
      let time;

      time = Log.format(1000);
      assert(time === '1000 ms');
      assert(time.length === 7);

      time = Log.format(1500);
      assert(time === ' 1.5  s');
      assert(time.length === 7);

      time = Log.format(1000 * 60);
      assert(time === '  60  s');
      assert(time.length === 7);

      time = Log.format(1234 * 20);
      assert(time === '24.7  s');
      assert(time.length === 7);

      time = Log.format(1000 * 60 * 60);
      assert(time === '  60min');
      assert(time.length === 7);

      time = Log.format(1234 * 60 * 20);
      assert(time === '24.7min');
      assert(time.length === 7);

      time = Log.format(1000 * 60 * 60 * 24);
      assert(time === '  24 hr');
      assert(time.length === 7);
    });
  });

  describe('::output', () => {
    it('should output the arguments with elapsed time and abby icon', () => {
      const { log, process } = setupFixtures();

      log.output('foo!');
      const output = stripAnsi(process.stdout.write.args[0][0]);

      assert(output.match(/\+[ \d]+ms @_@ foo!\n$/));
    });
  });

  describe('::getElapsed', () => {
    it('should return the elapsed time until called for formatted 7 characters', () => {
      const { log } = setupFixtures();
      const elapsed = log.getElapsed();

      assert(elapsed.length === 7);
      assert(elapsed.match(/[ \d]+ms$/));
    });
  });

  describe('events of Abigail', () => {
    describe('beforeImmediate', () => {
      it('should be output the relative packagePath', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate').then(() => {
          const message = stripAnsi(process.stdout.write.args[0][0]);

          assert(process.stdout.write.callCount === 1);
          assert(message.match(/use package.json\.\n$/));
        });
      });

      it('should be output that package.json is missing', () => {
        const { emitter, process } = setupFixtures();
        delete emitter.packagePath;
        return emitter.emit('beforeImmediate').then(() => {
          const message = stripAnsi(process.stdout.write.args[0][0]);

          assert(process.stdout.write.callCount === 1);
          assert(message.match(/missing package.json\.\n$/));
        });
      });
    });

    describe('log', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('log', 'bar!').then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ bar!\n$/));
          })
        );
      });
    });

    describe('run, done', () => {
      const task = {
        name: 'foo',
        exitCode: 1,
      };

      it('should be output the object.name unless single task', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('begin', [{}, {}])
        )
        .then(() =>
          emitter.emit('run', task).then(() => {
            const output = stripAnsi(process.stdout.write.args[2][0]);
            assert(output.match(/\+[ \d]+ms @_@ run foo.\n$/));
          })
        );
      });

      it('should be output the object.name and exitCode unless single task', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('begin', [{}, {}])
        )
        .then(() =>
          emitter.emit('done', task).then(() => {
            const output = stripAnsi(process.stdout.write.args[2][0]);
            assert(output.match(/\+[ \d]+ms @_@ done foo. exit code 1.\n$/));
          })
        );
      });
    });

    describe('begin, end', () => {
      const tasks = [
        {
          name: 'foo',
          exitCode: 1,
        },
        {
          name: 'bar',
          exitCode: 2,
        },
        {
          name: 'baz',
          exitCode: 3,
        },
      ];

      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('begin', tasks).then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ begin foo, bar, baz.\n$/));
          })
        );
      });

      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('end', tasks).then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ end foo, bar, baz. exit code 1, 2, 3.\n$/));
          })
        );
      });
    });

    describe('watch', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('beforeImmediate')
        .then(() =>
          emitter.emit('watch', '/path/to/dir', 'changed').then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ file \/path\/to\/dir changed.\n$/));
          })
        );
      });
    });
  });
});
