const R = require('ramda');
const {table} = require('table');
const [amount, nb] = process.argv.slice(2)
const kosztPrzychodu = 111.25
const withCap = R.curry((cap, paidSoFar) => Math.max(0, cap - paidSoFar))
const max30 = withCap(142950)
const sumaSkladek = R.curry((brutto, month) => brutto * (month-1))
const sumaSkladekWb = sumaSkladek(amount)

const withBrutto = {
  'Month': R.nthArg(1),
  'Brutto' : R.identity,
  'Emerytalna pracownika': (brutto, month) => {
    const sumaSkladek = sumaSkladekWb(month)
    const podstawa = Math.min(brutto, max30(sumaSkladek))
    return 0.0976 * podstawa;
  },
  'Rentowa pracownika': (brutto, month) => {
    const sumaSkladek = sumaSkladekWb(month)  
    const podstawa = Math.min(brutto, max30(sumaSkladek))
    return 0.015 * podstawa;
  }, 
  'Chorobowa': R.pipe(
    R.nthArg(0),
    R.multiply(0.0245)
  ),
  'Zasadnicze': (brutto, month) => {
    const wb = withBrutto
    return amount - wb['Emerytalna pracownika'](brutto, month) - wb['Rentowa pracownika'](brutto, month) - wb['Chorobowa'](brutto, month)
  },
  'Zdrowotna zus': (brutto, month)  => {
    const wb = withBrutto
    const zasadnicze = wb['Zasadnicze'](brutto, month)
    return 0.09 * zasadnicze   
  },
  'Zdrowotna do odliczenia': (brutto, month)  => {
    const wb = withBrutto
    const zasadnicze = amount - wb['Emerytalna pracownika'](brutto, month) - wb['Rentowa pracownika'](brutto, month) - wb['Chorobowa'](brutto, month)
    return 0.0775 * zasadnicze   
  },
  'Dochod': (brutto, month) => withBrutto['Zasadnicze'](brutto, month) - kosztPrzychodu,
  'Zaliczka pit': (brutto, month) => {
    // uwzglednic progi, poki co stale 18%
    return 0.18 * withBrutto['Dochod'](brutto, month) - 46.33 -  withBrutto['Zdrowotna do odliczenia'](brutto, month)
  }
}
const headers = Object.keys(withBrutto)
const months = Array(12).fill().map((_, ind) => ind + 1)

const retval = R.reduce
  ((acc, month) => {
     return [
       ...acc,  
       Object.values(withBrutto).map(f => Math.round(f(amount, month)*100)/100)
     ]
  }, [headers], months)
console.log(table(retval))
