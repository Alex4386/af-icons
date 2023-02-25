import chalk from 'chalk';
import Figlet from 'figlet';

function showBanner(): void {
  const title = 'AFIcons';

  console.log(Figlet.textSync(title, 'Small Slant'));
  console.log(chalk.cyan(chalk.underline('https://afplay2.tistory.com/entry/다운로드-공군-픽토그램')));
  console.log();
  console.log(`Copyright © ${chalk.bold(`${chalk.cyan('Republic of Korea Airforce')}, All rights reserved`)}`);
  console.log();
}

export default {
  showBanner,
};
