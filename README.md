TODO add https://crt.sh/?q=y.gy&output=json
TODO add a scrollmap like in vscode for the record colors

# features

change variable value

sort columns by primary value

config
use variable replacement?

hotkeys

# bugs

re-render issues

# IMPORTANT

use the install script to install node modules

## domainName regex

```js
SHOULD MATCH
augsburg.de
test.test.test.de.
dns-test.de
aaaa_aaa.y.gy
_.y.gy
a_.y.gy
_a.y.gy
_autodiscover._tcp.qaux.de.
_smtps._tcp.qaux.de.
a--.y.gy
a--.y.y.gy
a----------.y.gy
__.y.gy
a__.y.gy
xn--dmin-moa0i.example
xn--aaa-pla.example
xn--aaa-qla.example
xn--aaa-rla.example
xn--aaa-sla.example
xn--dj-kia8a.vu.example
xn--efran-2sa.example
xn--and-6ma2c.example
foo.xn--bg-colorcdf-9na9b.example
xn--4gbrim.xn----ymcbaaajlc6dj7bxne2c.xn--wgbh1c

SHOULD NOT MATCH
y.y.g____y
y.g_y
*.y.gy
*.y.y.gy
*.a--.y.gy
--.y.gy
-.y.gy
a-.y.gy
asss.sssssa.d
a.x.*.y.gy
.*.y.gy
*.*.y.gy
```
