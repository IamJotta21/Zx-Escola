import { TargetEntity } from '../types/import.type';

/**
 * Format raw file size into human-readable representation.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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

/**
 * Intelligent helper to suggest database mapping matches based on synonyms and text similarities.
 */
export const suggestMapping = (
  excelHeader: string,
  entityFields: { field: string; label: string; required: boolean }[]
): { matchedField: string; confidence: number } => {
  const cleanHeader = excelHeader
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

  const synonyms: Record<string, string[]> = {
    email: ['email', 'e-mail', 'mail', 'contacto', 'contato'],
    firstname: [
      'nome',
      'name',
      'primeironome',
      'first_name',
      'firstname',
      'aluno',
      'professor',
      'regente',
    ],
    lastname: ['sobrenome', 'last_name', 'lastname', 'segundonome'],
    phone: ['telefone', 'phone', 'celular', 'contato', 'tel'],
    birthdate: ['nascimento', 'data', 'birthdate', 'birth_date', 'datanascimento', 'nasc'],
    cpf: ['cpf', 'documento', 'identidade', 'cpf_aluno', 'cpfaluno'],
    rg: ['rg', 'registro', 'identidade'],
    gender: ['sexo', 'genero', 'gender', 'masculino', 'feminino'],
    address: ['endereco', 'address', 'rua', 'logradouro'],
    city: ['cidade', 'city', 'municipio'],
    state: ['estado', 'state', 'uf'],
    cep: ['cep', 'postalcode', 'zip', 'zipcode'],
    whatsapp: ['whatsapp', 'wpp', 'whats'],
    relationship: ['parentesco', 'relacao', 'relationship', 'vinculo'],
    isfinancial: ['financeiro', 'responsavelfinanceiro', 'paga', 'pagante'],
    gradeyear: ['serie', 'ano', 'grade', 'gradeyear', 'anoletivo'],
    schoolyear: ['anoletivo', 'schoolyear', 'periodo'],
    capacity: ['capacidade', 'limite', 'maximo', 'capacity'],
  };

  let bestField = '';
  let bestConfidence = 0;

  entityFields.forEach((item) => {
    const fieldKey = item.field.toLowerCase();
    const cleanLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Exact match
    if (fieldKey === cleanHeader || cleanLabel === cleanHeader) {
      bestField = item.field;
      bestConfidence = 100;
      return;
    }

    // 2. Synonyms check
    const list = synonyms[fieldKey] || [];
    const isSynonym = list.some((syn) => cleanHeader.includes(syn) || syn.includes(cleanHeader));

    if (isSynonym) {
      const confidence = cleanHeader === fieldKey ? 95 : 85;
      if (confidence > bestConfidence) {
        bestField = item.field;
        bestConfidence = confidence;
      }
    }

    // 3. String overlap checks (substring matches)
    if (
      cleanHeader.includes(fieldKey) ||
      fieldKey.includes(cleanHeader) ||
      cleanHeader.includes(cleanLabel) ||
      cleanLabel.includes(cleanHeader)
    ) {
      const confidence = 75;
      if (confidence > bestConfidence) {
        bestField = item.field;
        bestConfidence = confidence;
      }
    }
  });

  return {
    matchedField: bestField,
    confidence: bestConfidence,
  };
};
