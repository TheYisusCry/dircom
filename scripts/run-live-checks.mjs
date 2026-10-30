// Manual staging checks using bootstrap credentials already in process memory.
// Nothing is written to dotenv, and no credentials are printed or passed in argv.
import { spawn } from "node:child_process";

const username =
  process.env.DIRCOM_TEST_ADMIN_USERNAME || process.env.DIRCOM_ADMIN_USERNAME;
const password =
  process.env.DIRCOM_TEST_ADMIN_PASSWORD || process.env.DIRCOM_ADMIN_PASSWORD;
if (!username || !password) {
  console.error(
    "Configura las credenciales privadas del administrador para las pruebas.",
  );
  process.exit(1);
}
const child = spawn(
  process.execPath,
  ["--test", "tests/live/setup.test.mjs", "tests/live/supabase.test.mjs"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DIRCOM_RUN_LIVE_TESTS: "yes",
      DIRCOM_TEST_ADMIN_USERNAME: username,
      DIRCOM_TEST_ADMIN_PASSWORD: password,
    },
  },
);
child.on("error", () => {
  console.error("No se pudieron iniciar las pruebas reales.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
