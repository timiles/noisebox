export function toMinutesAndSeconds(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

function toTwoDigitString(number: number): string {
  return number.toString().padStart(2, '0');
}

export function toFilenameFriendlyString(date: Date): string {
  const dateParts = [
    date.getFullYear().toString(),
    toTwoDigitString(date.getMonth() + 1),
    toTwoDigitString(date.getDate()),
  ];
  const timeParts = [
    toTwoDigitString(date.getHours()),
    toTwoDigitString(date.getMinutes()),
    toTwoDigitString(date.getSeconds()),
  ];
  return `${dateParts.join('-')} ${timeParts.join('.')}`;
}
