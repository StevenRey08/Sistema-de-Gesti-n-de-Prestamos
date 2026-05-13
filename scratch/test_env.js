
console.log('typeof window:', typeof window);
if (typeof window !== 'undefined') {
  console.log('window.localStorage:', typeof window.localStorage);
  if (window.localStorage) {
    console.log('window.localStorage.getItem:', typeof window.localStorage.getItem);
  }
}
