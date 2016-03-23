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
const setupFixtures = (options = {}) => {
  const emitter = new AsyncEmitter;
  const process = createMockProcess();
  const opts = { process, notifyCwd: false, notifyPlugins: false, ...options };
  const log = new Log(emitter, true, opts);

  emitter.json = {
    path: lookupSync('package.json'),
  };

  return { log, emitter, process };
};

// specs
describe('Log', () => {
  describe('plugin lifecycle', () => {
    describe('attach-plugins', () => {
      it('should be output the relative packagePath', () => {
        const { emitter, process } = setupFixtures({ notifyCwd: true });
        return emitter.emit('attach-plugins').then(() => {
          const message = stripAnsi(process.stdout.write.args[0][0]);

          assert(process.stdout.write.callCount === 1);
          assert(message.match(/use package.json\.\n$/));
        });
      });

      it('should be output that package.json is missing', () => {
        const { emitter, process } = setupFixtures({ notifyCwd: true });
        delete emitter.json;
        return emitter.emit('attach-plugins').then(() => {
          const message = stripAnsi(process.stdout.write.args[0][0]);

          assert(process.stdout.write.callCount === 1);
          assert(message.match(/missing package.json\.\n$/));
        });
      });
    });

    describe('detach-plugins', () => {
      it('if the exit code is 0, it should cheer', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins').then(() =>
          emitter.emit('task-end', [{ script: { exitCode: 0 } }])
        )
        .then(() => emitter.emit('detach-plugins'))
        .then(() => {
          const message = stripAnsi(process.stdout.write.args[1][0]);

          assert(process.stdout.write.callCount === 2);
          assert(message.match('cheers for good work.\n'));
        });
      });

      it('unless the exit code is 0, it should apologize', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('detach-plugins').then(() => {
          const message = stripAnsi(process.stdout.write.args[0][0]);

          assert(process.stdout.write.callCount === 1);
          assert(message.match("i'm terribly sorry...\n"));
        });
      });
    });

    describe('log', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('log', 'bar!').then(() => {
            const output = stripAnsi(process.stdout.write.args[0][0]);
            assert(output.match(`ms ${stripAnsi(Log.icon)} bar!`));
          })
        );
      });
    });

    describe('script-error', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('script-error', new Error('baz~')).then(() => {
            const output = stripAnsi(process.stdout.write.args[0][0]);
            assert(output.match(`ms ${stripAnsi(Log.iconFatal)} Error: baz~`));
          })
        );
      });
    });

    describe('script-start, script-end', () => {
      const task = {
        script: { name: 'foo' },
        exitCode: 1,
      };

      it('should be output the object.name unless single task', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('task-start', [{}, {}])
        )
        .then(() =>
          emitter.emit('script-start', task).then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ script start foo.\n$/));
          })
        );
      });

      it('should be output the object.name and exitCode unless single task', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('task-start', [{}, {}])
        )
        .then(() =>
          emitter.emit('script-end', task).then(() => {
            const output = stripAnsi(process.stdout.write.args[1][0]);
            assert(output.match(/\+[ \d]+ms @_@ script end foo. exit code 1.\n$/));
          })
        );
      });
    });

    describe('task-start, task-end', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        const tasks = [
          {
            main: {
              name: 'foo',
              exitCode: 1,
            },
          },
          {
            main: {
              name: 'bar',
              exitCode: 2,
            },
          },
          {
            main: {
              name: 'baz',
              exitCode: 3,
            },
          },
        ];

        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('task-start', tasks).then(() => {
            const output = stripAnsi(process.stdout.write.args[0][0]);
            assert(output.match(/\+[ \d]+ms @_@ task start foo, bar, baz.\n$/));
          })
        );
      });

      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        const tasks = [
          {
            script: { name: 'foo' },
            exitCode: 1,
          },
          {
            script: { name: 'bar' },
            exitCode: 2,
          },
          {
            script: { name: 'baz' },
            exitCode: 3,
          },
        ];

        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('task-end', tasks).then(() => {
            const output = stripAnsi(process.stdout.write.args[0][0]);
            assert(output.match(/\+[ \d]+ms @_@ task end foo, bar, baz. exit code 1, 2, 3.\n$/));
          })
        );
      });
    });

    describe('watch', () => {
      it('should be output with the icon', () => {
        const { emitter, process } = setupFixtures();
        return emitter.emit('attach-plugins')
        .then(() =>
          emitter.emit('watch', '/path/to/dir', 'changed').then(() => {
            const output = stripAnsi(process.stdout.write.args[0][0]);
            assert(output.match(/\+[ \d]+ms @_@ file \/path\/to\/dir changed.\n$/));
          })
        );
      });
    });
  });

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
});
