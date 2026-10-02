import fs from 'fs';
import path from 'path';

const artifacts = [];

function add(type, id, name, desc, content, tags, rels = {}, extra = {}) {
  artifacts.push({
    id,
    applicationId: 'app-nexaone',
    type,
    name,
    description: desc,
    source: 'TraceIQ Synthetic',
    path: `demo-data/nexaone/${type}/${id}.json`,
    content,
    tags,
    ...rels,
    ...extra
  });
}

// SCENARIO 1, 2, 10, 11, 12: B2B Eligibility & History & Clients
add('requirements', 'req-b2b-001', 'B2B Services Eligibility', 'Defines when customers can see B2B services.',
  'Customers can see B2B services if they are associated with a client that enables B2B and they have reached the required tenure threshold (default 12 months).',
  ['b2b', 'eligibility'], { supersedes: ['req-b2b-stale'] }, 
  { status: 'active', owner: 'Product Manager', team: 'Core Platform', isBaseline: true, lastVerifiedAt: '2026-09-01T00:00:00Z' });

add('requirements', 'req-b2b-stale', 'B2B Original Eligibility (Stale)', 'Legacy requirement from Release 3.1',
  'B2B services are only available to existing legacy customers who were onboarded before 2023.',
  ['b2b', 'legacy'], { contradicts: ['req-b2b-001'] }, 
  { version: '3.1', status: 'deprecated', owner: 'Legacy PM', team: 'Core Platform', isBaseline: true });

add('business-rules', 'rule-b2b-tenure', 'B2B Tenure Rule', 'Rule for B2B tenure',
  'Threshold for B2B eligibility is exactly 12 months from the customer onboarding date.',
  ['b2b', 'tenure'], { implements: ['req-b2b-001'] });

add('decisions', 'dec-b2b-tenure', 'Decision: 12-Month Tenure', 'Why 12 months?',
  'We chose 12 months for B2B eligibility to offset the high 6-month churn rates in telecom.',
  ['b2b', 'decision']);

add('releases', 'rel-3.1', 'Release 3.1 Notes', 'Release 3.1 details',
  'B2B available only to existing customers.', ['release', '3.1']);

add('releases', 'rel-3.2', 'Release 3.2 Notes', 'Release 3.2 details',
  'B2B expanded to: existing customer OR customer with >12 months tenure.', ['release', '3.2']);

add('releases', 'rel-3.4', 'Release 3.4 Notes', 'Release 3.4 details',
  'Client-specific B2B configuration introduced. Telecom allowed, others disabled.', ['release', '3.4']);

add('configuration', 'cfg-client-a', 'Client A Configuration', 'Config for Telecom Client A',
  '{ "industry": "telecom", "b2bEnabled": true, "paymentRouting": "COMPANY_CODE_CURRENCY", "allowedPaymentMethods": ["CREDIT_CARD", "ACH"] }',
  ['client-a', 'config', 'telecom'], {}, 
  { clientId: 'client-a', status: 'active', owner: 'Integration Lead', team: 'Client Success', isBaseline: false, lastVerifiedAt: '2026-08-15T00:00:00Z' });

add('configuration', 'cfg-client-b', 'Client B Configuration', 'Config for Library Client B',
  '{ "industry": "library", "b2bEnabled": false, "paymentRouting": "ACCOUNT_CURRENCY", "allowedPaymentMethods": ["CREDIT_CARD"] }',
  ['client-b', 'config', 'library'], {}, 
  { clientId: 'client-b', status: 'active', owner: 'Integration Specialist', team: 'Client Success', isBaseline: false });

add('configuration', 'cfg-client-c', 'Client C Configuration', 'Config for Medical Client C',
  '{ "industry": "medical", "b2bEnabled": false, "paymentRouting": "COMPANY_CODE_CURRENCY_TYPE", "allowedPaymentMethods": ["ACH"] }',
  ['client-c', 'config', 'medical'], {}, 
  { clientId: 'client-c', status: 'active', owner: 'Integration Specialist', team: 'Client Success', isBaseline: false });

add('code', 'code-b2b-eligibility', 'B2bEligibilityService.ts', 'Service checking B2B access',
  'class B2bEligibilityService { canAccessB2B(customer) { const config = getClientConfig(customer.clientId); if (!config.b2bEnabled) return false; return customer.tenureMonths >= 12; } }',
  ['b2b', 'typescript'], { dependsOn: ['cfg-client-a', 'rule-b2b-tenure'] });

add('tests', 'test-b2b-001', 'B2bEligibilityService.spec.ts', 'Unit tests for B2B eligibility',
  'it("denies access if tenure < 12", () => { ... }); it("allows if config enabled and tenure >= 12", () => { ... });',
  ['b2b', 'test'], { validates: ['code-b2b-eligibility'] });

add('defects', 'def-b2b-comp', 'Defect: Competitor matches B2B earlier', 'Competitor pressure',
  'Competitors offer B2B at 6 months. We need to lower our threshold from 12 months to 6 months.',
  ['defect', 'b2b'], { affects: ['rule-b2b-tenure', 'code-b2b-eligibility'] });

add('requirements', 'req-b2b-6mo', 'Proposed: 6-Month B2B Eligibility', 'Proposed threshold reduction',
  'Reduce the B2B tenure requirement to 6 months to match competitor offerings.',
  ['b2b', 'eligibility', 'proposed'], { contradicts: ['req-b2b-001'] }, 
  { status: 'proposed', owner: 'Growth Product Manager', team: 'Growth Team', isBaseline: true, sourceArtifactIds: ['def-b2b-comp'] });

add('designs', 'design-b2b-stale', 'B2B Flow Design (Outdated)', 'Figma export from 3.1',
  'Shows B2B locked for everyone except marked legacy accounts.',
  ['design', 'stale'], { contradicts: ['req-b2b-001'] }, { version: '3.1' });

// SCENARIO 3: Product visibility
add('requirements', 'req-prod-vis', 'Product Visibility', 'Catalog rules',
  'All users can see Fiber, Copper, Duct, and Pole. B2B Services are only visible if the user is B2B eligible.',
  ['products', 'visibility']);

add('database', 'db-products', 'Products Table', 'Schema for products',
  'CREATE TABLE products (id UUID, name VARCHAR, type VARCHAR); // rows: Fiber, Copper, Duct, Pole, B2B',
  ['database', 'sql']);

add('code', 'code-prod-catalog', 'ProductCatalogComponent.tsx', 'React component for catalog',
  'function Catalog({customer}) { const prods = getAll(); const b2bEligible = b2bSvc.canAccessB2B(customer); return prods.filter(p => p.type !== "B2B" || b2bEligible).map(...); }',
  ['react', 'products'], { dependsOn: ['code-b2b-eligibility', 'req-prod-vis'] });

add('tests', 'test-prod-vis', 'ProductCatalogComponent.spec.tsx', 'Component test',
  'it("hides B2B for 8 month telecom user", () => { ... }); it("shows all for 13 month telecom user", () => { ... });',
  ['test', 'react'], { validates: ['code-prod-catalog'] });

// SCENARIO 4 & 5 & 6 & 7: Payments, Splitting, Hierarchy, Routing
add('requirements', 'req-pay-methods', 'Payment Methods', 'Allowed methods',
  'System supports Credit Card, Debit Card, and ACH. Availability is driven by Client Configuration.',
  ['payments', 'methods'], {},
  { status: 'active', owner: 'Payments PM', team: 'Payments Squad', isBaseline: true });

add('requirements', 'req-receipt-split', 'Receipt Splitting', 'Receipt logic',
  'One payment can cover multiple invoices. The system must split the payment into multiple receipts grouped by Company Code and Currency.',
  ['payments', 'receipts'], {},
  { status: 'active', owner: 'Billing Arch', team: 'Billing Squad', isBaseline: true });

add('decisions', 'dec-receipt-group', 'Decision: Receipt Grouping', 'Why CC+Currency?',
  'Group by Company Code + Currency to align with ERP ledger batching requirements.',
  ['payments', 'erp']);

add('requirements', 'req-hierarchy', 'Account Hierarchy Allocation', 'Parent/child accounts',
  'Payments can be made by a Parent Account and allocated across Invoices belonging to multiple Child Accounts. Allocation scope is the Account Hierarchy.',
  ['hierarchy', 'payments']);

add('database', 'db-accounts', 'Accounts Schema', 'Hierarchy tables',
  'CREATE TABLE accounts (id UUID, parent_id UUID NULL, name VARCHAR);',
  ['database', 'accounts']);

add('business-rules', 'rule-allocation', 'Payment Allocation Rule', 'Allocation vs Grouping',
  'Allocation applies across the Account Hierarchy. Receipt generation groups the allocated amounts strictly by Company Code + Currency.',
  ['payments', 'rules'], { implements: ['req-hierarchy', 'req-receipt-split'] });

add('code', 'code-receipt-svc', 'ReceiptService.java', 'Splits receipts',
  'public List<Receipt> split(Payment p) { return p.getAllocations().stream().collect(groupingBy(a -> a.getCompanyCode() + "_" + a.getCurrency())).... }',
  ['java', 'payments'], { dependsOn: ['rule-allocation'] });

add('code', 'code-payment-routing', 'PaymentRouter.java', 'Routing logic',
  'public String getRoutingKey(Client c, Invoice i) { if (c.getRoutingRule() == "COMPANY_CODE_CURRENCY") return i.cc + i.curr; ... }',
  ['java', 'payments'], { dependsOn: ['cfg-client-a', 'cfg-client-b', 'cfg-client-c'] });

add('tests', 'test-receipt-split', 'ReceiptServiceTest.java', 'Tests receipt generation',
  'void testSplitAcrossCompanyCodes() { ... assert receipts.size() == 2; }',
  ['test', 'java'], { validates: ['code-receipt-svc'] });

add('tests', 'test-hierarchy', 'AccountHierarchyTest.java', 'Tests hierarchy allocation',
  'void testParentPaysChildInvoices() { ... }',
  ['test', 'hierarchy'], { validates: ['rule-allocation'] });

// SCENARIO 8: Invoice eligibility
add('requirements', 'req-inv-states', 'Invoice States', 'State machine for invoices',
  'OPEN: visible & payable. PAID: visible in history, not payable. CANCELLED: hidden from normal payment, not payable. DISPUTED: visible, payment disabled.',
  ['invoices', 'states']);

add('business-rules', 'rule-inv-payable', 'Payable Invoices Rule', 'Logic for payability',
  'An invoice can be selected for payment ONLY if state == OPEN.',
  ['invoices', 'rules'], { implements: ['req-inv-states'] });

add('database', 'db-invoices', 'Invoices Schema', 'SQL schema for invoices',
  'CREATE TABLE invoices (id UUID, account_id UUID, state VARCHAR CHECK(state IN("OPEN","PAID","CANCELLED","DISPUTED")), amount DECIMAL);',
  ['database', 'invoices']);

add('code', 'code-inv-svc', 'InvoiceService.ts', 'Invoice logic',
  'function getPayable(invoices) { return invoices.filter(i => i.state === "OPEN"); }',
  ['typescript', 'invoices'], { dependsOn: ['rule-inv-payable'] });

add('designs', 'design-inv-ui', 'Invoice List UI', 'Figma design',
  'Shows DISPUTED invoices with a greyed out checkbox. CANCELLED invoices are under the "Archived" tab.',
  ['design', 'invoices'], { implements: ['req-inv-states'] });

add('tests', 'test-inv-states', 'InvoiceService.spec.ts', 'Unit tests for invoice states',
  'it("excludes DISPUTED from payable", () => { ... }); it("includes OPEN", () => { ... });',
  ['test', 'invoices'], { validates: ['code-inv-svc'] });

// SCENARIO 9: Notification eligibility
add('requirements', 'req-notif-elig', 'Notification Eligibility', 'When to send emails',
  'Send notification IF: customer is active AND invoice is eligible (OPEN) AND client notification is enabled AND recipient is valid.',
  ['notifications', 'email']);

add('business-rules', 'rule-notif-elig', 'Notification Rule', 'Notification conditions',
  'All 4 conditions must be met simultaneously. If recipient email bounces, recipient becomes invalid.',
  ['notifications', 'rules'], { implements: ['req-notif-elig'] });

add('configuration', 'cfg-notif', 'Global Notification Config', 'Toggle notifications',
  '{ "emailGateway": "SendGrid", "retryCount": 3, "defaultEnabled": true }',
  ['config', 'notifications']);

add('code', 'code-notif-svc', 'NotificationDispatcher.cs', 'C# Notification logic',
  'public void Dispatch(Customer c, Invoice i) { if (c.IsActive && i.State == "OPEN" && c.Client.NotifEnabled && IsValid(c.Email)) Send(...); }',
  ['csharp', 'notifications'], { dependsOn: ['rule-notif-elig', 'cfg-notif'] });

add('tests', 'test-notif-elig', 'NotificationDispatcherTest.cs', 'Tests notification dispatch',
  'public void Test_NoEmail_When_Disputed() { ... }',
  ['test', 'notifications'], { validates: ['code-notif-svc'] });

// Fill remaining to hit ~50-60 target. Let's add some more architecture and defects.
add('architecture', 'arch-frontend', 'Frontend Architecture', 'React + Vite',
  'We use React 18 with Vite. State management via Redux Toolkit.',
  ['architecture', 'react']);
add('architecture', 'arch-backend', 'Backend Architecture', 'Microservices',
  'Java Spring Boot for Payments, Node.js for B2B and Invoices, C# for Notifications.',
  ['architecture', 'microservices']);
add('architecture', 'arch-db', 'Database Architecture', 'PostgreSQL',
  'Main relational data in PostgreSQL 15. Read replicas used for Invoice History.',
  ['architecture', 'database']);
add('architecture', 'arch-events', 'Event Bus Architecture', 'Kafka',
  'Payment completions trigger Kafka events consumed by NotificationDispatcher.',
  ['architecture', 'kafka'], { dependsOn: ['code-notif-svc', 'code-receipt-svc'] });

add('defects', 'def-receipt-01', 'Defect: Missing Receipt', 'Receipt not generated',
  'When payment covers 3 invoices, but one has an empty company code, it crashes.',
  ['defect', 'payments'], { affects: ['code-receipt-svc'] });
add('defects', 'def-notif-01', 'Defect: Spamming Disputed Invoices', 'Emails sent wrongly',
  'Customers received payment reminders for DISPUTED invoices. Rule was ignored.',
  ['defect', 'notifications'], { affects: ['code-notif-svc'], contradicts: ['rule-notif-elig'] });

add('requirements', 'req-onboarding', 'Customer Onboarding', 'Signup flow',
  'Customers register via an invite link. Collect Company Name, Tax ID, Primary Contact.',
  ['onboarding']);
add('business-rules', 'rule-approval', 'Approval Workflow', 'Onboarding approval',
  'All new accounts require manual approval by an admin before they become ACTIVE.',
  ['onboarding', 'approval'], { implements: ['req-onboarding'] });
add('code', 'code-onboarding-svc', 'OnboardingService.ts', 'Handles signup',
  'function register(data) { const user = db.insert(data); user.state = "PENDING_APPROVAL"; return user; }',
  ['typescript', 'onboarding'], { dependsOn: ['rule-approval'] });
add('tests', 'test-onboarding', 'OnboardingService.spec.ts', 'Tests onboarding',
  'it("sets state to PENDING_APPROVAL", () => { ... });',
  ['test', 'onboarding'], { validates: ['code-onboarding-svc'] });
add('database', 'db-customers', 'Customers Table', 'Schema',
  'CREATE TABLE customers (id UUID, client_id UUID, state VARCHAR, email VARCHAR, tenure_months INT);',
  ['database', 'customers']);

add('designs', 'design-onboarding', 'Onboarding Form', 'Figma',
  'Shows 3-step wizard: Basic Info, Tax Details, Review.',
  ['design', 'onboarding'], { implements: ['req-onboarding'] });
add('decisions', 'dec-tax-id', 'Decision: Mandatory Tax ID', 'Compliance',
  'Tax ID made mandatory during onboarding to comply with EU B2B invoicing laws.',
  ['compliance', 'decision'], { affects: ['req-onboarding'] });
add('releases', 'rel-3.5', 'Release 3.5 Notes', 'Latest release',
  'Added mandatory Tax ID to onboarding. Fixed notification spam defect.',
  ['release', '3.5'], { relatedArtifactIds: ['def-notif-01', 'dec-tax-id'] });

// Write to files
function main() {
  const baseDir = path.join(process.cwd(), 'demo-data', 'nexaone');
  
  // Clean directories
  const dirs = [
    'requirements', 'business-rules', 'architecture', 'code', 'database',
    'configuration', 'designs', 'releases', 'decisions', 'defects', 'tests'
  ];
  
  dirs.forEach(d => {
    const p = path.join(baseDir, d);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    } else {
      fs.readdirSync(p).forEach(f => fs.unlinkSync(path.join(p, f)));
    }
  });

  const ids = new Set();
  const typeCount = {};
  let total = 0;
  let relCount = 0;
  
  artifacts.forEach(a => {
    // Dup check
    if (ids.has(a.id)) {
      console.error("DUPLICATE ID:", a.id);
      process.exit(1);
    }
    ids.add(a.id);
  });
  
  artifacts.forEach(a => {
    // Ref check
    ['relatedArtifactIds', 'implements', 'dependsOn', 'supersedes', 'contradicts', 'validates', 'affects'].forEach(rel => {
      if (a[rel]) {
        a[rel].forEach(ref => {
          if (!ids.has(ref)) {
             console.error(`BROKEN REF in ${a.id}: ${ref}`);
             process.exit(1);
          }
          relCount++;
        });
      }
    });
    
    // Stats
    typeCount[a.type] = (typeCount[a.type] || 0) + 1;
    total++;
    
    // Write
    const outPath = path.join(baseDir, a.type, a.id + '.json');
    fs.writeFileSync(outPath, JSON.stringify(a, null, 2));
  });
  
  console.log("=== Dataset Generation Report ===");
  console.log(`Total artifacts: ${total}`);
  console.log(`Explicit relationships: ${relCount}`);
  console.log("Type breakdown:");
  console.table(typeCount);
  console.log("Validation: PASS (No duplicates, no broken references)");
}

main();
