
const DEFAULT_CODES = {
  API_TYPE: 'apv2',
  AVANTAGES_SOCIAUX: 'asv2',
  FINANCIAL_SERVICES: 'sfv2'
};

const API_TYPE_MAPPING = {
  'assurance particuliers': 'apv2',
  'avantages sociaux': 'asv2',
  'cautionnement': 'cv2',
  'assurance entreprise': 'epv2',
  'services financiers': 'sfv2'
};

const AVANTAGES_SOCIAUX_SERVICE_MAPPING = {
  'sante': 'sante',
  'dentaire': 'dentaire',
  'vue': 'vue',
  'invalidite': 'invalidite',
  'vie': 'vie',
  'voyage': 'voyage',
  'soins': 'soins'
};

const FINANCIAL_SERVICES_MAPPING = {
  'hypotheque': 'hypotheque',
  'pret': 'pret',
  'investissement': 'investissement',
  'assurance': 'assurance'
};

function mapReferenceTypeToApiType(referenceType) {
  const normalizedType = (referenceType || '').toLowerCase();
  return API_TYPE_MAPPING[normalizedType] || DEFAULT_CODES.API_TYPE;
}

function normalizeServicesString(services) {
  if (!services || services === 'null') return [];
  return String(services)
    .replace(/[{}]/g, '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function mapServicesToApiCodes(services, serviceMapping, defaultCode) {
  const cleaned = normalizeServicesString(services);
  if (cleaned.length === 0) return [defaultCode];
  const apiCodes = [];
  cleaned.forEach(service => {
    const lower = service.toLowerCase();
    Object.entries(serviceMapping).forEach(([keyword, code]) => {
      if (lower.includes(keyword) && !apiCodes.includes(code)) {
        apiCodes.push(code);
      }
    });
  });
  return apiCodes.length > 0 ? apiCodes : [defaultCode];
}

function mapAvantagesSociauxToApiCodes(avantagesSociauxServices) {
  return mapServicesToApiCodes(avantagesSociauxServices, AVANTAGES_SOCIAUX_SERVICE_MAPPING, DEFAULT_CODES.AVANTAGES_SOCIAUX);
}

function mapFinancialServicesToApiCodes(financialServices) {
  return mapServicesToApiCodes(financialServices, FINANCIAL_SERVICES_MAPPING, DEFAULT_CODES.FINANCIAL_SERVICES);
}

function getTypeSpecificData(apiType, record) {
  switch (apiType) {
    case 'apv2':
      const result = {
        assuranceParticuliersV2: {
          codeEPIC: `ref_${record.id}`
        }
      };
      return result;
    case 'asv2':
      return {
        avantageSociauxV2: {
          typeService: mapAvantagesSociauxToApiCodes(record.avantages_sociaux_services),
          nomEntreprise: record.company_name || 'Entreprise',
          nombreEmployes: parseInt(record.number_of_employees || '0')
        }
      };
    case 'cv2':
      return {
        cautionnementV2: {
          etreContacte: true,
          typeService: mapAvantagesSociauxToApiCodes(record.cautionnement_services),
          nomEntreprise: record.company_name || 'Entreprise'
        }
      };
    case 'epv2':
      return {
        assuranceEntrepriseV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          etreContacte: true,
          typesEntreprisePossibles: [
            { id: 'egv2', libelle: 'Grande entreprise', actif: true }
          ]
        }
      };
    case 'sfv2':
      return {
        servicesFinanciersV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          nombreEmployes: parseInt(record.number_of_employees || '0'),
          typeService: mapFinancialServicesToApiCodes(record.financial_services)
        }
      };
    default:
      return {
        assuranceParticuliersV2: {
          codeEPIC: `ref_${record.id}`
        }
      };
  }
}

function transformToApiFormat(record) {
  const apiType = mapReferenceTypeToApiType(record.reference_type);
  const typeSpecificData = getTypeSpecificData(apiType, record);
  return {
    id: record.id,
    type: apiType,
    courrielReferenceur: record.your_email,
    nomReferenceur: record.your_name,
    nom: record.referee_name,
    telephone: record.referee_phone || '',
    courriel: record.referee_email || '',
    autresInfos: record.additional_info || '',
    payable: true,
    ...typeSpecificData
  };
}

module.exports = {
  transformToApiFormat
};
