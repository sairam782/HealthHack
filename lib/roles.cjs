'use strict';
// Proposed adult inpatient demo policy, not a verified RWJUH shift roster.
const groups = {
  clinical: 'Clinical care', bedside: 'Bedside assistance', envops: 'Environmental and operational support', specialized: 'Specialized and supportive care'
};
const definitions = [
  ['nurse','Registered nurse (RN)','clinical','direct','Nursing'],
  ['bedside','Patient care technician (PCT)','bedside','direct','Bedside Care'],
  ['assistant','Nursing assistant','bedside','direct','Bedside Care'],
  ['charge','Charge nurse','clinical','escalation','Nursing'],
  ['manager','Nurse manager / nursing supervisor','clinical','oversight',null],
  ['physician','Hospitalist / attending physician','clinical','consult','Medical Team'],
  ['resident','Resident physician','clinical','consult','Medical Team'],
  ['fellow','Fellow','clinical','consult','Medical Team'],
  ['app','Advanced practice provider (NP/PA)','clinical','consult','Medical Team'],
  ['respiratory','Respiratory therapist (RT)','clinical','consult','Respiratory Therapy'],
  ['observer','Patient sitter / observer','bedside','observer','Bedside Care'],
  ['housekeeping','Environmental services (EVS)','envops','direct','Environmental Services'],
  ['dietary','Dietary / food services','envops','direct','Food Services'],
  ['facilities','Facilities staff','envops','direct','Facilities'],
  ['clerk','Unit secretary / unit clerk','envops','direct','Unit Clerk'],
  ['transport','Patient transport staff','envops','direct','Patient Transport'],
  ['specialist','Specialist referral coordinator','specialized','coordination','Specialized Services'],
  ['pt','Physical therapist (PT)','specialized','consult','Physical Therapy'],
  ['ot','Occupational therapist (OT)','specialized','consult','Occupational Therapy'],
  ['slp','Speech-language pathologist (SLP)','specialized','consult','Speech and Swallowing'],
  ['pharmacist','Clinical pharmacist','specialized','consult','Pharmacy'],
  ['dietitian','Registered dietitian','specialized','consult','Nutrition'],
  ['case-manager','Case manager','specialized','consult','Case Management'],
  ['social-worker','Social worker','specialized','consult','Social Work'],
  ['wound','Wound care nurse','specialized','consult','Wound Care'],
  ['advocate','Patient advocate','specialized','consult','Patient Advocacy'],
  ['interpreter','Interpreter / ASL interpreter','specialized','consult','Language Services'],
  ['chaplain','Chaplain / spiritual care','specialized','consult','Spiritual Care'],
  ['infection','Infection prevention personnel','specialized','consult','Infection Prevention'],
  ['coordinator','Unit coordinator','envops','coordination',null]
];
const ROLES = definitions.map(([id,title,group,mode,department]) => ({
  id,title,group,group_label:groups[group],mode,department,
  departments: department ? [department] : [],
  viewAll: ['charge','manager','coordinator'].includes(id),
  manageRoster: ['charge','manager','coordinator'].includes(id),
  canAct: !['oversight','observer'].includes(mode),
  canRefer: ['nurse','charge','specialist','coordinator'].includes(id),
  clinicalReferrals: ['nurse','charge'].includes(id)
}));
const byId = Object.fromEntries(ROLES.map(role => [role.id,role]));
const clinicalDepartments = new Set(['Medical Team','Respiratory Therapy','Speech and Swallowing','Pharmacy','Nutrition','Wound Care','Infection Prevention','Physical Therapy','Occupational Therapy']);
const REFERRAL_TARGETS = [...new Set(ROLES.filter(role=>role.mode==='consult').map(role=>role.department))].map(department=>({
  department, clinical:clinicalDepartments.has(department), tier: ['Medical Team','Respiratory Therapy','Wound Care'].includes(department)?'clinical':'specialized',
  responder:ROLES.filter(role=>role.department===department).map(role=>role.title).join(' / ')
}));
function profile(user) { return byId[user.id] || null; }
function canAccept(user,department) {
  const role=profile(user);
  return Boolean(role?.canAct && user.on_shift && role.departments.includes(department) && user.competencies?.includes(department));
}
module.exports = {ROLES,REFERRAL_TARGETS,profile,canAccept,groups};
