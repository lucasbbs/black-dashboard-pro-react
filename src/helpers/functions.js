import { addDays } from 'date-fns';
import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

export function reverseFormatNumber(val, locale = 'pt-BR') {
  if (!isNaN(val)) return val;

  var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
  var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
  // try {
  var reversedVal = val
    .replace(new RegExp('\\' + group, 'g'), '')
    .replace(new RegExp('\\' + decimal, 'g'), '.')
    .replace(/[^0-9.]/g, '');
  // } catch (error) {
  //   console.log(error);
  // }

  return Number.isNaN(reversedVal) ? 0 : Number(reversedVal);
}

export function currencyFormat(label, currency = 'BRL') {
  let formatCurrency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatCurrency.format(Number(label));
}

export function percentageFormat(label, digits = 10) {
  let formatPercentage = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    // maximumFractionDigits: 2,
    minimumFractionDigits: digits,
  });
  return formatPercentage.format(label);
}

export function decimalFormat(label) {
  let formatPercentage = new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    maximumFractionDigits: 4,
    minimumFractionDigits: 4,
  });
  return formatPercentage.format(label);
}
export const getDataForTotalTaxes = (income) => {
  let dates = [];
  const incomesarray = [];
  income.forEach((data) => {
    dates = dates.concat([
      ...data.incomes
        .filter((key) => Object.values(key)[0].type === 'income')
        .map((key) => Object.keys(key)[0]),
    ]);
    incomesarray.push(...data.incomes.map((value) => Object.entries(value)[0]));
  });

  let datesSet = new Set(dates);
  datesSet = [...datesSet].sort();
  datesSet = datesSet.map((date) =>
    incomesarray.filter((e) => e[0].includes(date))
  );
  const labels = [];
  const taxes = [];
  datesSet.forEach((el) => {
    labels.push(
      ...new Set(
        el.map((date) => date[0].replace('income', '').replace('fund', ''))
      )
    );
    taxes.push(
      el.map((value) => value[1].tax).reduce((acc, curr) => acc + curr, 0)
    );
  });
  return [labels, taxes];
};

export const getGlobalAverageReturn = (investments, dateInput) => {
  const currentAmounts = investments
    .map((investment) => {
      return {
        ...investment,
        incomes: investment.incomes.filter(
          (income) => Object.values(income)[0].type === 'income'
        ),
      };
    })
    .filter(
      (investment) =>
        new Date(investment.investment_date).getTime() <=
        new Date(dateInput).getTime()
    )
    .map(
      (investment) =>
        investment.initial_amount +
        investment.incomes
          .filter((income) => {
            return (
              new Date(Object.keys(income)[0].replace('income', '')) <=
              dateInput
            );
          })
          .map((income) => Object.values(income)[0].value)
          .reduce((acc, curr) => acc + curr, 0)
    );
  const incomes = investments
    .filter(
      (investment) =>
        new Date(investment.investment_date).getTime() <=
        new Date(dateInput).getTime()
    )
    .map((investment) =>
      investment.incomes.find((income) => {
        return Object.keys(income)[0].replace('income', '') === dateInput;
      })
    )
    .filter((value) => value !== undefined)
    .map((value) => Object.values(value)[0].value);

  return currentAmounts.length !== 0
    ? incomes.reduce((acc, curr) => acc + curr, 0) /
        currentAmounts.reduce((acc, curr) => acc + curr, 0)
    : 0;
};
//prettier-ignore
export const getHowMuchMoneyToFinancialFreedom = (value, investments,currency,  exchangeRates) => {

  return value - (investments.length !== 0 ? investments.filter(inv=> {
    return inv.isArchived === false}).map((investment) =>  (investment.initial_amount + investment.accrued_income)*exchangeRates[`${investment.broker.currency}_${currency}`])
    .reduce((acc, curr) => acc + curr, 0):
    0)
};

export const getDataForTheFirstChart = (
  income,
  firstPeriod = undefined,
  lastPeriod = undefined
) => {
  // var isInitialUndefined = false;
  let dates = [];
  const incomesarray = [];

  income.forEach((data) => {
    dates = dates.concat([
      ...data.incomes
        .filter((key) => Object.values(key)[0].type === 'income')
        .map((key) => Object.keys(key)[0]),
    ]);
    incomesarray.push(...data.incomes.map((value) => Object.entries(value)[0]));
  });

  let datesSet = new Set(dates);
  datesSet = [...datesSet].sort();
  if (firstPeriod === undefined) {
    // isInitialUndefined = true;
    firstPeriod = datesSet[0];
  }
  if (lastPeriod === undefined) {
    lastPeriod = datesSet[datesSet.length - 1];
  }

  // const initialSlice = // isInitialUndefined
  //   // ?
  //   datesSet.indexOf(firstPeriod);
  // //  : datesSet.indexOf(firstPeriod);
  // const finalSlice =
  //   datesSet //.sort()
  //     .indexOf(lastPeriod) + 1;

  datesSet = datesSet.map((date) =>
    incomesarray.filter((e) => e[0].includes(date))
  );
  let labels = [];
  let values = [];

  datesSet.forEach((el) => {
    labels.push(
      ...new Set(
        el.map((date) =>
          format(
            addDays(
              new Date(date[0].replace('income', '').replace('fund', '')),
              1
            ),
            'MMM/yyyy',
            { locale: ptBR }
          )
        )
      )
    );
    values.push(
      el
        .map((value) => value[1].value - value[1].tax)
        .reduce((acc, curr) => acc + curr, 0)
    );
  });

  // labels = labels.slice(initialSlice, finalSlice);
  // values = values.slice(initialSlice, finalSlice);

  return [values, labels];
};

export const handleSlicesOfInvestments = (
  investments,
  initialDate,
  finalDate
) => {
  const initialSlice =
    investments[1].indexOf(
      format(new Date(initialDate), 'MMM/yyyy', { locale: ptBR })
    ) === -1
      ? 0
      : investments[1].indexOf(
          format(new Date(initialDate), 'MMM/yyyy', { locale: ptBR })
        );
  const finalSlice =
    investments[1].indexOf(
      format(new Date(finalDate), 'MMM/yyyy', { locale: ptBR })
    ) + 1;

  return initialSlice !== -2 && finalSlice !== 0
    ? [
        investments[0].slice(initialSlice, finalSlice),
        investments[1].slice(initialSlice, finalSlice),
      ]
    : investments;
};

export const getDataForTheInflationChart = (
  inflation,
  firstPeriod = undefined,
  lastPeriod = undefined
) => {
  if (firstPeriod === undefined || firstPeriod === '-01') {
    firstPeriod = inflation[0].data;
  }
  if (lastPeriod === undefined || lastPeriod === '-01') {
    lastPeriod = inflation[inflation.length - 1].data;
  }

  let inflations = inflation.slice(
    Math.max(inflation.map((e) => e.data).indexOf(firstPeriod) - 11, 0),
    inflation.map((e) => e.data).indexOf(lastPeriod) + 1
  );
  inflations = getSimpleMovingAverage(inflations);
  inflations = inflations.slice(
    Math.min(inflation.map((e) => e.data).indexOf(firstPeriod), 11)
  );
  const labels = [];
  const values = [];
  inflations.forEach((e) => {
    labels.push(
      format(addDays(new Date(e.data), 1), 'MMM/yyyy', { locale: ptBR })
    );
    values.push(e.valor);
  });
  return [values, labels];
};
export const getDataForTheInflationChartTotalPeriod = (
  inflation,
  firstPeriod = undefined,
  lastPeriod = undefined
) => {
  if (firstPeriod === undefined || firstPeriod === '-01') {
    firstPeriod = inflation[0].data;
  }
  if (lastPeriod === undefined || lastPeriod === '-01') {
    lastPeriod = inflation[inflation.length - 1].data;
  }

  let inflations = inflation.slice(
    inflation.map((e) => e.data).indexOf(firstPeriod),
    inflation.map((e) => e.data).indexOf(lastPeriod) + 1
  );
  const cumulativeProduct = ((product) => (value) => (product *= value))(1);

  inflations = inflations.map((inf) => {
    return {
      data: inf.data,
      valor: (cumulativeProduct(inf.valor) - 1) * 100,
    };
  });

  const labels = [];
  const values = [];
  inflations.forEach((e) => {
    labels.push(
      format(addDays(new Date(e.data), 1), 'MMM/yyyy', { locale: ptBR })
    );
    values.push(e.valor);
  });
  return [values, labels];
};

export const getTopInvestmentsByLocation = (investments) => {
  const countries = [
    ...new Set(investments.map((investment) => investment.broker.country)),
  ];
  const currenciesperCountries = [];
  for (const country of countries) {
    const currenciesPerCountry = [
      ...new Set(
        investments
          .filter((investment) => investment.broker.country === country)
          .map((investment) => investment.broker.currency)
      ),
    ];
    currenciesperCountries.push([country, currenciesPerCountry]);
  }
  const result = [];
  for (const country of currenciesperCountries) {
    for (const currency of country[1]) {
      const globalTopInvestments = investments
        .filter((investment) => investment.broker.currency === currency)
        .reduce(
          (acc, curr) => acc + curr.initial_amount + curr.accrued_income,
          0
        );
      result.push([country[0], currency, globalTopInvestments]);
    }
  }

  return result;
};

//prettier-ignore
export const getSimpleMovingAverage = (inflations) => {

  const initialPeriodInflations = inflations.slice(0, 11).map((infl, index, array)=> 
  ({data: infl.data, valor: array.slice(0, index +1).reduce((acc, curr) => acc * curr.valor, 1)})).map((infl) => ({ data: infl.data, valor: (infl.valor - 1) * 100 }));
  const remainingInflations =  inflations
    .map((inf, index, array) => 
       ({ data: inf.data, valor: array.slice(index - 12 + 1, index + 1).reduce((acc, curr) => acc * curr.valor, 1)})).map((infl) => ({ data: infl.data, valor: (infl.valor - 1) * 100 }));

  return [...initialPeriodInflations, ...remainingInflations.slice(11)]
};

export const getDataForTheTopInvestmentsTable = (
  investments,
  currentMonth = '2021-07-01'
) => {
  currentMonth = currentMonth.length < 10 ? currentMonth + '-01' : currentMonth;

  let incomes = investments.map((investment) => [
    investment.name,
    investment.incomes.filter(
      (date) =>
        Object.entries(date)[0][0].replace('income', '').replace('fund', '') ===
        currentMonth
    ),
  ]);

  const indexes = [];
  for (let i = 0; i < incomes.length; i++) {
    incomes[i][1].length !== 0 && indexes.push(i);
  }

  incomes = incomes.filter((e) => e[1].length !== 0);

  const filteredInvestments = (investments = investments.filter((e, index) =>
    indexes.includes(index)
  ));
  const returns = [];
  for (let i = 0; i < filteredInvestments.length; i++) {
    const accrued_income = filteredInvestments.map((inv) =>
      inv.incomes
        .map((income) => {
          let object = {};
          //prettier-ignore
          object[Object.keys(income)[0].replace('income', '').replace('fund', '')] = Object.values(income)[0];
          return object;
        })
        .filter(
          (date) => new Date(Object.keys(date)[0]) <= new Date(currentMonth)
        )
        .reduce((acc, curr) => acc + Object.values(curr)[0].value, 0)
    );
    returns.push([
      filteredInvestments[i]._id,
      filteredInvestments[i].name,
      Object.values(incomes[i][1][0])[0].value /
        (filteredInvestments[i].initial_amount + accrued_income[i]),
      filteredInvestments[i].initial_amount + accrued_income[i],
      filteredInvestments[i].broker.currency,
    ]);
  }
  return returns.sort((a, b) => b[2] - a[2]).slice(0, 7);
};
// Codigo usado para representar numero como percentuais
// .toLocaleString('pt-br', { style: 'percent', minimumFractionDigits: 2 }
