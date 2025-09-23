
const DEFAULT_CODES = {
  API_TYPE: 'apv2',
  AVANTAGES_SOCIAUX: 'asv2',
  FINANCIAL_SERVICES: 'sfv2',
  CAUTIONNEMENT: 'ccn'
};

const API_TYPE_MAPPING = {
  'particuliers': 'apv2',
  'avantages-sociaux': 'asv2',
  'cautionnement': 'cv2',
  'entreprises': 'epv2',
  'services-financiers': 'sfv2',
  'entreprises_grandeentreprise': 'egv2',
  'entreprises_agricole': 'eav2'
};

const AVANTAGES_SOCIAUX_SERVICE_MAPPING = {
  'assurance-collective': 'asc',
  'regime-retraite': 'rer',
  'consultation-rh': 'crh'
};

const FINANCIAL_SERVICES_MAPPING = {
  'assurance-salaire': 'asa',
  'placement': 'plc',
  'hypotheque': 'hyp',
  'ligne-personnelle': 'lip',
  'ligne-commerciale': 'lic',
  'assurances-voyages': 'asvo'
};

const CAUTIONNEMENT_MAPPING = {
  'cautionnement-contrats': 'ccn',
  'cautionnement-commerciaux': 'cco',
  'assurance-credit-depots': 'acd'
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

function mapCautionnementTypeToApiCodes(typeCautionnement) {
  return mapServicesToApiCodes(typeCautionnement, CAUTIONNEMENT_MAPPING, DEFAULT_CODES.CAUTIONNEMENT);
}

function getTypeSpecificData(apiType, record) {
  switch (apiType) {
    case 'apv2':
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        assuranceParticuliersV2: {
          codeEPIC: ``
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    case 'asv2':
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        avantageSociauxV2: {
          typeService: mapAvantagesSociauxToApiCodes(record.avantages_sociaux_services),
          nomEntreprise: record.company_name || 'Entreprise',
          nombreEmployes: parseInt(record.number_of_employees || '0')
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    case 'cv2':
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        cautionnementV2: {
          etreContacte: true,
          typeService: mapCautionnementTypeToApiCodes(record.cautionnement_services),
          nomEntreprise: record.company_name || 'Entreprise'
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    case 'epv2': // PME
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        assuranceEntrepriseV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          etreContacte: true,
          typesEntreprisePossibles: [
            { id: 'epv2', libelle: 'PME', actif: true }
          ]
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    case 'eav2': // Agricole
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        assuranceEntrepriseV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          etreContacte: true,
          typesEntreprisePossibles: [
            { id: 'eav2', libelle: 'Agricole', actif: true }
          ]
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;      
    case 'egv2': // Grande entreprise
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        assuranceEntrepriseV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          etreContacte: true,
          typesEntreprisePossibles: [
            { id: 'egv2', libelle: 'Grande entreprise', actif: true }
          ]
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    case 'sfv2':
      let fichiers = [];
      if (record.attachment_name && record.attachment_content) {
        let base64Content = record.attachment_content;
        const idx = base64Content.indexOf('base64,');
        if (idx !== -1) {
          base64Content = base64Content.substring(idx + 7);
        }
        fichiers.push({ name: record.attachment_name, content: base64Content });
      }
      const result = {
        servicesFinanciersV2: {
          nomEntreprise: record.company_name || 'Entreprise',
          nombreEmployes: parseInt(record.number_of_employees || '0'),
          typeService: mapFinancialServicesToApiCodes(record.financial_services)
        }
      };
      if (fichiers.length > 0) {
        result.fichiers = fichiers;
      }
      return result;
    default:
      return {
        assuranceParticuliersV2: {
          codeEPIC: ``
        }
      };
  }
}

function transformToApiFormat(record) {
  const apiType = mapReferenceTypeToApiType(record.reference_type);
  const typeSpecificData = getTypeSpecificData(apiType, record);
  let autresInfos = record.additional_info || '';
  // if (record.referee_name) {
  //   autresInfos += (autresInfos ? ' | ' : '') + ` Nom référent: ${record.referee_name}`;
  // }
  // if (record.referee_email) {
  //   autresInfos += (autresInfos ? ' | ' : '') + ` Email référent: ${record.referee_email}`;
  // }
  // if (record.referee_phone) {
  //   autresInfos += (autresInfos ? ' | ' : '') + ` Téléphone référent: ${record.referee_phone}`;
  // }
  //   if (record.your_name) {
  //   autresInfos += (autresInfos ? ' | ' : '') + ` Nom source: ${record.your_name}`;
  // }
  // if (record.your_email) {
  //   autresInfos += (autresInfos ? ' | ' : '') + ` Email source: ${record.your_email}`;
  // }

  return {
    id: record.id,
    type: apiType,
    courrielReferenceur: process.env.COMPANY_EMAIL || record.your_email,
    nomReferenceur: record.your_name,
    nom: record.referee_name,
    telephone: record.referee_phone || '',
    courriel: record.referee_email || '',
    autresInfos,
    payable: process.env.PAYABLE === 'true',
    ...typeSpecificData
  };
}

module.exports = {
  transformToApiFormat
};
