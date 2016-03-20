// dependencies
import chalk from 'chalk';
import { relative as relativePath } from 'path';
import Plugin from 'abigail-plugin';

// main
export default class Log extends Plugin {
  /**
  * @static
  * @property icon
  */
  static icon = chalk.magenta('@_@');

  /**
  * @static
  * @property pass
  */
  static pass = chalk.cyan.underline;

  /**
  * @static
  * @property fail
  */
  static fail = chalk.yellow.underline;

  /**
  * @static
  * @method strong
  * @param {array|string} arg
  * @returns {string} output - underlined characters
  */
  static strong(arg, glue = ', ') {
    if (arg instanceof Array) {
      return arg.map(word => chalk.underline(word)).join(glue);
    }
    return chalk.underline(arg);
  }

  /**
  * @static
  * @method statuses
  * @param {array|any} arg - source chalacters
  * @param {array|number} ref - exit code
  * @returns {string} output - ansi colored characters (cyan or yellow)
  */
  static statuses(arg, ref, glue = ', ') {
    const args = arg instanceof Array ? arg : [arg];
    let refs;
    if (ref instanceof Array) {
      refs = ref;
    } else if (ref !== undefined && ref !== null) {
      refs = [ref];
    } else {
      refs = args;
    }

    return args.map((status, i) =>
      refs[i] > 0 ? Log.fail(status) : Log.pass(status)
    ).join(glue);
  }

  /**
  * @static
  * @method
  * @param {number} diff - millseconds
  * @returns {string} elapsed - human readable time
  */
  static format(diff) {
    let weight = diff;
    let unit = ' ms';
    if (weight > 1000) {
      weight = Math.round((weight / 1000) * 10) / 10;
      unit = '  s';
      if (weight > 60) {
        weight = Math.round((weight / 60) * 10) / 10;
        unit = 'min';
        if (weight > 60) {
          weight = Math.round((weight / 60) * 10) / 10;
          unit = ' hr';
        }
      }
    }

    return `   ${weight}${unit}`.slice(-7);
  }

  /**
  * @method pluginWillAttach
  * @returns {undefined}
  */
  pluginWillAttach() {
    this.elapsed = Date.now();

    if (!this.parent.packagePath) {
      this.output('missing package.json.');
    } else {
      const path = relativePath(this.opts.process.cwd(), this.parent.packagePath);
      this.output(`use ${chalk.inverse(path)}.`);
    }

    this.parent.on('log', (...args) => {
      this.output(...args);
    });

    const runLog = (scriptResult) => {
      this.output(`run ${Log.strong(scriptResult.name)}.`);
    };
    const doneLog = (scriptResult) => {
      const name = Log.statuses(scriptResult.name, scriptResult.exitCode);
      const code = Log.statuses(scriptResult.exitCode);

      this.output(`done ${name}. exit code ${code}.`);
    };

    this.parent.on('begin', (task = []) => {
      const names = task.map((script) => script.name);
      this.output(`begin ${Log.strong(names)}.`);

      if (task.length > 1) {
        this.parent.on('run', runLog);
        this.parent.on('done', doneLog);
      }
    });
    this.parent.on('end', (task = []) => {
      const names = task.map((script) => script.name);
      const codes = task.map((script) => script.exitCode);
      this.output(`end ${Log.statuses(names, codes)}. exit code ${Log.statuses(codes)}.`);

      this.parent.removeListener('run', runLog);
      this.parent.removeListener('done', doneLog);
    });

    this.parent.on('watch', (path, event) => {
      this.output(`file ${chalk.bold(path)} ${event}.`);
    });
  }

  /**
  * @public
  * @method output
  * @param {any} args
  * @returns {undefined}
  */
  output(...args) {
    const ms = this.getElapsed();
    const msColored = chalk.gray(`+ ${ms}`);
    this.opts.process.stdout.write(`${msColored} ${Log.icon} ${args.join(' ')}\n`);
  }

  /**
  * @public
  * @method getElapsed
  * @returns {undefined}
  */
  getElapsed() {
    const diff = (Date.now() - this.elapsed) || 0;
    this.elapsed = Date.now();
    return Log.format(diff);
  }
}
