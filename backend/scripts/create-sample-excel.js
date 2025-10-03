const ExcelJS = require('exceljs');
const path = require('path');

async function createSampleDroolsTable() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ProductOffering');

  worksheet.getCell('A1').value = 'RuleSet';
  worksheet.getCell('B1').value = 'com.example.drools.rules';
  
  worksheet.getCell('A2').value = 'Import';
  worksheet.getCell('B2').value = 'com.example.model.Customer, com.example.model.Customer.CustomerLifeStage, com.example.model.Customer.CustomerAssets, com.example.model.Customer.CustomerNeed, com.example.model.Offer, com.example.model.Offer.Product, com.example.model.Offer.ProductPackage';
  
  worksheet.getCell('A3').value = 'Variables';
  worksheet.getCell('B3').value = 'com.example.model.Offer offer';
  
  worksheet.getCell('A4').value = 'Notes';
  worksheet.getCell('B4').value = 'Sample decision table for product offering based on customer profile and needs';

  
  worksheet.getCell('A6').value = 'RuleTable Product Offering Rules';
  
  worksheet.getCell('A7').value = 'NAME';
  worksheet.getCell('B7').value = 'CONDITION';
  worksheet.getCell('C7').value = 'CONDITION';
  worksheet.getCell('D7').value = 'CONDITION';
  worksheet.getCell('E7').value = 'ACTION';
  worksheet.getCell('F7').value = 'ACTION';
  
  worksheet.getCell('A8').value = '';
  worksheet.getCell('B8').value = '$customer:Customer';
  worksheet.getCell('C8').value = '';
  worksheet.getCell('D8').value = '';
  worksheet.getCell('E8').value = '';
  worksheet.getCell('F8').value = '';
  
  worksheet.getCell('A9').value = '';
  worksheet.getCell('B9').value = '$customer.getLifeStage() == ($param)';
  worksheet.getCell('C9').value = '$customer.getAssets() == ($param)';
  worksheet.getCell('D9').value = '$customer.getNeeds() contains ($param)';
  worksheet.getCell('E9').value = 'offer.setProductPackage($param);';
  worksheet.getCell('F9').value = 'offer.setDiscount($param);';
  
  worksheet.getCell('A10').value = 'Rule Name';
  worksheet.getCell('B10').value = 'Life Stage';
  worksheet.getCell('C10').value = 'Assets';
  worksheet.getCell('D10').value = 'Needs';
  worksheet.getCell('E10').value = 'Product Package';
  worksheet.getCell('F10').value = 'Discount';
  
  const rules = [
    {
      name: 'CareerFocusedPackage',
      lifeStage: 'CustomerLifeStage.CAREERFOCUSED',
      assets: '',
      needs: '',
      productPackage: 'ProductPackage.CAREERFOCUSED_PACKAGE',
      discount: ''
    },
    {
      name: 'HighAssetsDiscount',
      lifeStage: 'CustomerLifeStage.CAREERFOCUSED',
      assets: 'CustomerAssets.OVER300K',
      needs: '',
      productPackage: '',
      discount: '15'
    },
    {
      name: 'MortgageNeedLoan',
      lifeStage: '',
      assets: 'CustomerAssets.FROM150KTO300K',
      needs: 'CustomerNeed.MORTGAGE',
      productPackage: '',
      discount: ''
    },
    {
      name: 'InsuranceNeed',
      lifeStage: '',
      assets: '',
      needs: 'CustomerNeed.LIFEINSURANCE',
      productPackage: 'ProductPackage.INSURANCE_PACKAGE',
      discount: ''
    }
  ];
  
  rules.forEach((rule, index) => {
    const row = 11 + index;
    worksheet.getCell(`A${row}`).value = rule.name;
    worksheet.getCell(`B${row}`).value = rule.lifeStage;
    worksheet.getCell(`C${row}`).value = rule.assets;
    worksheet.getCell(`D${row}`).value = rule.needs;
    worksheet.getCell(`E${row}`).value = rule.productPackage;
    worksheet.getCell(`F${row}`).value = rule.discount;
  });

  const outputPath = path.join(__dirname, '../test-data/sample-drools-table.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`Sample Drools Decision Table created: ${outputPath}`);
  return outputPath;
}

createSampleDroolsTable().catch(console.error);
