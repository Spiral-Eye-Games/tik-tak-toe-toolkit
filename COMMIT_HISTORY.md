# Histórico de commits → versión revisada

Tabla complementaria de **`CHANGELOG.md`**: mapeo **SHA corto** ↔ **semver asignado** cuando el mensaje de Git fue poco claro y la versión se **reconstruyó** leyendo el diff. Mantener esta tabla al día al agregar releases (nuevas filas **arriba**, como `CHANGELOG.md`). La política **vX.Y.Z** está en **`.cursor/rules/changelog.mdc`**.

---

## Referencia rápida

| Commit   | Mensaje original (Git)           | Versión revisada |
|----------|-----------------------------------|------------------|
| `93bd07b` | omision and surrender            | **v2.12.0** |
| `03d54e8` | gravity coliders                 | **v2.11.0** |
| `4233298` | fixes                            | **v2.10.2** |
| `f946055` | fix                              | **v2.10.1** |
| `ade0882` | new inputs, turn list and fixes  | **v2.10.0** |
| `d1d0c87` | cronometer                       | **v2.9.0** |
| `e0e1e29` | true online release              | **v2.8.2** |
| `3dfd90a` | online release                   | **v2.8.1** |
| `7937b70` | multiplayer v3.4                 | **v2.8.0** |
| `033e57f` | multiplayer v3.3                 | **v2.7.0** |
| `f42b773` | multiplayer v3.1                | **v2.6.1** |
| `a316d40` | multiplayer v3                   | **v2.6.0** |
| `d4a34c3` | various upgrades 2.2             | **v2.5.2** |
| `ab1e025` | various upgrades 2.1             | **v2.5.1** |
| `2024fdb` | various upgrades 2               | **v2.5.0** |
| `89c11ca` | various upgrades 1.1             | **v2.4.1** |
| `f1ffac8` | various upgrades 1               | **v2.4.0** |
| `7963ef7` | fix conection updates            | **v2.3.1** |
| `6b8bd92` | multiplayer playing              | **v2.3.0** |
| `f851310` | multiplayer limits               | **v2.2.0** |
| `4aa544f` | better online ui                 | **v2.1.0** |
| `1b0881d` | fix connected players            | **v2.0.4** |
| `efbf869` | fix                              | **v2.0.3** |
| `37a4bfa` | fix deploy                       | **v2.0.2** (par) |
| `e76c780` | fix deploy                       | **v2.0.2** (par) |
| `95269ca` | first multiplayer version        | **v2.0.0** |
| `ad75ad8` | player icons fix                 | **v1.10.2** |
| `856f82d` | fix                              | **v1.10.3** |
| `104b802` | block and movements              | **v1.10.0** |
| `cffaf67` | better info                      | **v1.10.1** |
| `08ac0b5` | fixes                            | **v1.9.1** |
| `b5d6274` | colapsing                        | **v1.9.0** |
| `f2c1af0` | fix numeric inputs               | **v1.8.1** |
| `da5e234` | new coins                        | **v1.8.0** |
| `35b2cd6` | new icons                        | **v1.7.1** |
| `a9d0f4e` | refactor                         | **v1.7.0** |
| `2794efd` | fix                              | **v1.6.1** |
| `3a5952c` | fixes                            | **v1.6.0** |
| `9faad9f` | no emojis                        | **v1.5.2** |
| `01eb332` | fixes                            | **v1.5.1** |
| `4869e29` | presets                          | **v1.5.0** |
| `795267c` | timer                            | **v1.4.0** |
| `a57c21d` | ruptura y gravedad               | **v1.3.0** |
| `7f7e1c8` | multiplayer                     | **v1.2.0** |
| `a6d29bf` | translations                     | **v1.1.0** |
| `f18aaa9` | rename                           | **v1.0.2** |
| `b854663` | deploy                           | **v1.0.2** |
| `fb129af` | deploy                           | **v1.0.1** |
| `7fdf38a` | deploy workflow                  | **v1.0.1** |
| `fd65aef` | addons                           | **v1.0.1** |
| `ec184b4` | inital commit                    | **v1.0.0** |

---

**Notas (política v1):** Para **v1.0.1** y **v1.0.2** hay varios commits que comparten el mismo número de **parche** (agrupación habitual). **v1** usa **.Y** grandes en orden cronológico real; por eso **gravedad/roturas** (`a57c21d`) es **v1.3.0** y **cronómetro** (`795267c`) es **v1.4.0**. Tras **v1.10.x** comienza la era **v2** (online).
