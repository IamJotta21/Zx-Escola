import { TargetEntity } from '../types/ImportType';

/**
 * Returns list of standard/expected database fields for each target entity
 * to help user configure the column mappings.
 */
export const getEntityFields = (
  entity: TargetEntity
): { field: string; label: string; required: boolean }[] => {
  switch (entity) {
    case 'STUDENT':
      return [
        { field: 'email', label: 'E-mail', required: true },
        { field: 'firstName', label: 'Nome', required: true },
        { field: 'lastName', label: 'Sobrenome', required: true },
        { field: 'phone', label: 'Telefone', required: false },
        { field: 'birthDate', label: 'Data de Nascimento', required: false },
        { field: 'cpf', label: 'CPF', required: false },
        { field: 'rg', label: 'RG', required: false },
        { field: 'gender', label: 'Sexo', required: false },
        { field: 'address', label: 'Endereço', required: false },
        { field: 'city', label: 'Cidade', required: false },
        { field: 'state', label: 'Estado', required: false },
        { field: 'cep', label: 'CEP', required: false },
        { field: 'whatsapp', label: 'WhatsApp', required: false },
        { field: 'fatherName', label: 'Nome do Pai', required: false },
        { field: 'motherName', label: 'Nome da Mãe', required: false },
      ];
    case 'TEACHER':
      return [
        { field: 'email', label: 'E-mail', required: true },
        { field: 'firstName', label: 'Nome', required: true },
        { field: 'lastName', label: 'Sobrenome', required: true },
        { field: 'phone', label: 'Telefone', required: false },
        { field: 'subjects', label: 'Disciplinas (ex: Matemática, Física)', required: false },
        { field: 'workload', label: 'Carga Horária Semanal', required: false },
      ];
    case 'GUARDIAN':
      return [
        { field: 'name', label: 'Nome Completo', required: true },
        { field: 'email', label: 'E-mail', required: false },
        { field: 'phone', label: 'Telefone', required: false },
        { field: 'whatsapp', label: 'WhatsApp', required: false },
        { field: 'relationship', label: 'Grau de Parentesco (ex: Pai, Mãe)', required: false },
        { field: 'isFinancial', label: 'Responsável Financeiro (true/false)', required: false },
      ];
    case 'CLASS':
      return [
        { field: 'name', label: 'Nome da Turma', required: true },
        { field: 'gradeYear', label: 'Série/Ano', required: true },
        { field: 'schoolYear', label: 'Ano Letivo (ex: 2026)', required: true },
        { field: 'roomId', label: 'ID da Sala', required: false },
        { field: 'teacherId', label: 'ID do Professor Regente', required: false },
      ];
    case 'ROOM':
      return [
        { field: 'name', label: 'Nome/Número da Sala', required: true },
        { field: 'capacity', label: 'Capacidade Limite', required: false },
      ];
    default:
      return [];
  }
};
