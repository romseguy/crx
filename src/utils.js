export const notExist = (value) =>
  value === undefined || value === null || value === "";

export const exist = (value) => !notExist(value);

export const convertTimeStringToSeconds = (value) => {
  if (notExist(value)) {
    return 0;
  }

  const parts = value.split(":");
  if (parts.length < 2) {
    return 0;
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
};
