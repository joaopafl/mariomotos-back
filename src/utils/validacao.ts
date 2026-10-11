export function somenteDigitos(valor: string): string {
  return (valor || "").replace(/\D/g, "");
}

/** Valida CPF pelos digitos verificadores. */
export function cpfValido(cpfBruto: string): boolean {
  const cpf = somenteDigitos(cpfBruto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(cpf.slice(0, 9), 10) === Number(cpf[9]) && digito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

/** Placa antiga (ABC1234) ou Mercosul (ABC1D23). Devolve a placa normalizada ou "" se invalida. */
export function normalizarPlaca(valor: string): string {
  const placa = (valor || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa) ? placa : "";
}
