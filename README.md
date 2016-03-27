Abigail Log Plugin
---

<p align="right">
  <a href="https://npmjs.org/package/abigail-plugin-log">
    <img src="https://img.shields.io/npm/v/abigail-plugin-log.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/abigailjs/abigail-plugin-log">
    <img src="http://img.shields.io/travis/abigailjs/abigail-plugin-log.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/abigailjs/abigail-plugin-log/coverage">
    <img src="https://img.shields.io/codeclimate/github/abigailjs/abigail-plugin-log.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/abigailjs/abigail-plugin-log">
    <img src="https://img.shields.io/codeclimate/coverage/github/abigailjs/abigail-plugin-log.svg?style=flat-square">
  </a>
  <a href="https://gemnasium.com/abigailjs/abigail-plugin-log">
    <img src="https://img.shields.io/gemnasium/abigailjs/abigail-plugin-log.svg?style=flat-square">
  </a>
</p>

No installation
---

> abigail built-in plugin

Usage
---
if this plugin is enabled, output the debugging information.

```bash
abby test
# +    1 ms @_@ use package.json.
# +    1 ms @_@ plugin enabled exit, log, launch, watch.
# +   21 ms @_@ task start test.
# ...
#   18 passing (56ms)
# ...
# +  2.8  s @_@ task end test. exit code 0.
# +    1 ms @_@ ... watch at src/**/*.js, test/**/*.js.
```

if turned off, becomes only to the output of the emulator.

```bash
abby test --no-log
# ...
#   18 passing (56ms)
# ...
```

See also
---
* [abigailjs/abigail](https://github.com/abigailjs/abigail#usage)
* [abigailjs/abigail-plugin](https://github.com/abigailjs/abigail-plugin#usage)

Development
---
Requirement global
* NodeJS v5.7.0
* Npm v3.7.1

```bash
git clone https://github.com/abigailjs/abigail-plugin-log
cd abigail-plugin-log
npm install

npm test
```

License
---
[MIT](http://abigailjs.mit-license.org/)
