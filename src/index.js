// dependencies
import Plugin from 'abigail-plugin';
import chalk from 'chalk';
import { relative as relativePath } from 'path';
import flattenDeep from 'lodash.flattendeep';

// @class Log
export default class Log extends Plugin {
  /**
  * @static
  * @property defaultOptions
  */
  static defaultOptions = {
    notifyCwd: true,
    notifyPlugins: true,
  }

  /**
  * @static
  * @property icon
  */
  static icon = chalk.magenta('@_@');

  /**
  * @static
  * @property iconFatal
  */
  static iconFatal = chalk.magenta.inverse('@_@;');

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
  * @method important
  * @param {array|string} arg
  * @returns {string} output - underlined characters
  */
  static important(arg, glue = ', ') {
    if (arg instanceof Array) {
      return arg.map(word => chalk.inverse(word)).join(glue);
    }
    return chalk.inverse(arg);
  }

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

    if (this.opts.notifyCwd) {
      if (this.parent.json && this.parent.json.path) {
        const path = relativePath(this.opts.process.cwd(), this.parent.json.path);
        this.output(`use ${chalk.inverse(path)}.`);
      } else {
        this.output('missing package.json.');
      }
    }

    if (this.opts.notifyPlugins) {
      const available = [];
      for (const key in this.parent.plugins) {
        if (this.parent.plugins.hasOwnProperty(key) === false) {
          continue;
        }
        available.push(this.parent.plugins[key].name);
      }
      this.output(`plugin enabled ${Log.important(available)}.`);
    }

    this.parent.on('log', (...args) => {
      this.output(...args);
    });
    this.parent.on('script-error', (...args) => {
      this.outputFatal(...args);
    });

    const scriptStart = (scriptResult) => {
      this.output(`run ${Log.strong(scriptResult.name)}.`);
    };
    const scriptEnd = (scriptResult) => {
      const name = Log.statuses(scriptResult.name, scriptResult.exitCode);
      const code = Log.statuses(scriptResult.exitCode);

      this.output(`done ${name}. exit code ${code}.`);
    };

    this.parent.on('task-start', (task = []) => {
      const names = flattenDeep(task).map((serial) => serial.main ? serial.main.name : 'unknown');
      this.output(`begin ${Log.strong(names)}.`);

      if (task.length > 1) {
        this.parent.on('script-start', scriptStart);
        this.parent.on('script-end', scriptEnd);
      }
    });
    this.parent.on('task-end', (result = []) => {
      const scripts = flattenDeep(result);
      const names = scripts.map((script) => script.script.name);
      const codes = scripts.map((script) => script.exitCode);
      this.exit = scripts.reduce((prev, script) => prev > 0 || script.exitCode > 0 ? 1 : 0, 0);
      this.output(`end ${Log.statuses(names, codes)}. exit code ${Log.statuses(codes)}.`);

      this.parent.removeListener('script-start', scriptStart);
      this.parent.removeListener('script-end', scriptEnd);
    });

    this.parent.on('watch', (path, event) => {
      this.output(`file ${chalk.bold(path)} ${event}.`);
    });
  }

  /**
  * @method pluginWillAttach
  * @returns {undefined}
  */
  pluginWillDetach() {
    if (this.exit === 0) {
      this.output('cheers for good work.');
    } else {
      this.outputFatal("i'm terribly sorry...");
    }
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
  * @method outputFatal
  * @param {any} args
  * @returns {undefined}
  */
  outputFatal(...args) {
    const ms = this.getElapsed();
    const msColored = chalk.gray(`+ ${ms}`);
    this.opts.process.stdout.write(`${msColored} ${Log.iconFatal} ${args.join(' ')}\n`);
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
