# Dependency security

Last reviewed: 2026-10-23

## Accepted upstream advisory

`npm audit` reports [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) against `node-forge@1.4.0`.

The package is transitive through Expo's development CLI:

```text
expo@58.0.17
└─ @expo/cli@58.1.14
   ├─ node-forge@1.4.0
   └─ @expo/code-signing-certificates@0.0.7
      └─ node-forge@1.4.0
```

The advisory concerns verification of attacker-controlled RSA PKCS#1 v1.5 signatures. The application does not import `node-forge`, and the package is not included in the client runtime bundle. Exposure is limited to Expo CLI operations on trusted project inputs.

No fixed `node-forge` release is currently published: npm lists `1.4.0` as the latest version, while the advisory affects versions through `1.4.0`. Expo SDK 58's current CLI depends on that release. npm's suggested `expo@44.0.6` change is an incompatible downgrade, not a valid remediation.

Until Expo publishes an SDK 58-compatible update:

- do not use `npm audit fix --force`;
- do not run Expo CLI commands on untrusted projects or signing material;
- keep Expo SDK 58 packages on their latest compatible patch versions;
- re-run `npm audit` when Expo or `node-forge` publishes an update.

The remaining four high-severity audit entries (`expo`, `@expo/cli`, `@expo/code-signing-certificates`, and `node-forge`) all describe this single transitive advisory.
