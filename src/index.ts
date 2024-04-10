#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";

import inquirer from "inquirer";
import os from "os";
import chalk from "chalk";
import path from "path";
import { createDetector } from "./detector.js";

const program = new Command();
const packageJson = fs.readFileSync("package.json", "utf8");
const { version } = JSON.parse(packageJson);

program
  .version(version)
  .description("Analyze the code to determine if it was written by AI")
  .option(
    "-f, --file <type> -p, --probability <type>",
    "Analyze the specified file"
  )
  .option("-d, --dir <type>", "Analyze the specified directory")
  .option("-r, --reset", "Reset the configuration")
  .action(action)
  .parse(process.argv);

async function action(options) {
  const configPath = path.join(os.tmpdir(), "/.ai-detector.json");
  const isExists = fs.existsSync(configPath);
  
  if (options.reset) {
    if (isExists) {
      fs.unlinkSync(configPath);
    }
    return;
  }

  if (!isExists) {
    const { token } = await inquirer.prompt([
      {
        type: "input",
        name: "token",
        message: "Enter your OpenAI API token",
      },
    ]);
    const models = await createDetector({ token }).getModels();
    const { model } = await inquirer.prompt([
      {
        type: "list",
        name: "model",
        message: "Select a model",
        choices: models,
      },
    ]);

    const { percent } = await inquirer.prompt([
      {
        type: "input",
        name: "percent",
        message:
          "Enter the acceptable % of the probability that the code was written by AI",
        default: 100,
      },
    ]);

    fs.writeFileSync(
      configPath,
      JSON.stringify({ model, token, percent }),
      "utf8"
    );

    action(options);
  } else {
    const config = fs.readFileSync(configPath, "utf8");
    const { model, token, percent = 100 } = JSON.parse(config);
    const detector = createDetector({ model, token });
    const message = ({ result, filePath, percent }) => {
      if (result >= percent) {
        return chalk.red(`${filePath} - ${result}%`);
      }
      return chalk.green(`${filePath} - ${result}%`);
    };

    if (options.file) {
      const filePath = path.join(process.cwd(), options.file);
      const code = fs.readFileSync(filePath, "utf8");
      const result = await detector.detect(code);
      console.log(message({ result, filePath, percent }));

      if (result >= percent) {
        throw new Error("The code was written by AI");
      }
    }

    if (options.dir) {
      let flag = false;
      await processDirectory(
        path.join(process.cwd(), options.dir),
        async (filePath: string) => {
          const code = fs.readFileSync(filePath, "utf8");
          const result = await detector.detect(code);
          console.log(message({ result, filePath, percent }));
          if (result >= percent) {
            flag = true;
          }
        }
      );

      if (flag) {
        throw new Error("Some code was written by AI");
      }
    }
  }
}

async function processDirectory(directory, callback) {
  const entries = fs.readdirSync(directory);

  let promises = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath, callback);
    } else {
      promises.push(callback(fullPath));

      if (promises.length === 5) {
        await Promise.all(promises);
        promises = [];
      }
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }
}
