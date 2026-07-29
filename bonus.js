/**
 * @param {string[]} strs
 * @return {string}
 */
var longestCommonPrefix = function (strs) {
  let res = "";

  const minLength = strs.reduce(
    (mn, str) => Math.min(mn, str.length),
    Infinity,
  );

  for (let i = 1; i <= minLength; ++i) {
    const pre = strs[0].slice(0, i);

    let j;
    for (j = 1; j < strs.length; ++j) {
      const cur = strs[j].slice(0, i);
      if (cur !== pre) break;
    }

    if (j == strs.length) {
      res = pre;
    }
  }

  return res;
};
