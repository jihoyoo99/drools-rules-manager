# Drools Decision Table Excel Format Specification

## Overview

Drools Decision Tables provide a way to define business rules in a spreadsheet format that can be easily understood and maintained by business users. The Excel format (.xlsx) follows a specific structure that gets converted into Drools Rule Language (DRL) at runtime.

## Excel File Structure

A Drools Decision Table Excel file consists of several distinct sections:

### 1. Metadata Section (Rows 1-4)
The first few rows contain metadata that defines the rule package, imports, variables, and documentation.

### 2. Rule Table Section (Rows 6+)
The actual decision table starts with a "RuleTable" declaration followed by column headers and rule definitions.

## Concrete Example: Product Offering Decision Table

Based on analysis of a real Drools Decision Table, here's a complete example:

### Excel Structure:

| Row | Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|-----|----------|----------|----------|----------|----------|----------|----------|
| 1 | RuleSet | net.cloudburo.drools | | | | | |
| 2 | Import | net.cloudburo.drools.model.Customer, net.cloudburo.drools.model.Customer.CustomerLifeStage, net.cloudburo.drools.model.Customer.CustomerNeed, net.cloudburo.drools.model.Customer.CustomerAssets, net.cloudburo.drools.model.Offer, net.cloudburo.drools.model.Offer.ProductPackage, net.cloudburo.drools.model.Offer.Product | | | | | |
| 3 | Variables | net.cloudburo.drools.model.Offer offer | | | | | |
| 4 | Notes | This is a simple decision table sample, which suggests product set suitable for a customer by taking into consideration customer personal data and expressed needs. | | | | | |
| 5 | | | | | | | |
| 6 | RuleTable Initial Product Offering | | | | | | |
| 7 | NAME | CONDITION | CONDITION | CONDITION | ACTION | ACTION | ACTION |
| 8 | | $customer:Customer | | | | | |
| 9 | | $customer.getLifeStage() in ($param) | $customer.getAssets() in ($param) | $customer.getNeeds() contains ($param) | offer.setFinancialPackage($param); | offer.addSingleProduct($param); | offer.setDiscount($param); |
| 10 | Rule Name | Customer type | Assets | Needs | FinancialPackageProposal | SingleProductProposal | Discount |
| 11 | ProductPackageSelection | CustomerLifeStage.CAREERFOCUSED | | | ProductPackage.CAREERFOCUSED_PACKAGE | | |
| 12 | DiscountNone | CustomerLifeStage.CAREERFOCUSED | CustomerAssets.TO50K | | | | |
| 13 | DiscountLevel1 | CustomerLifeStage.CAREERFOCUSED | CustomerAssets.FROM50KTO150K | | | | 5 |
| 14 | DiscountLevel2 | CustomerLifeStage.CAREERFOCUSED | CustomerAssets.FROM150KTO300K | | | | 10 |
| 15 | DiscountLevel3 | CustomerLifeStage.CAREERFOCUSED | CustomerAssets.OVER300K | | | | 15 |
| 16 | NeedsAssessmentInsurance | | | CustomerNeed.LIFEINSURANCE | | Product.INSURANCE | |
| 17 | NeedsAssessmentMortgage1 | | CustomerAssets.FROM50KTO150K | CustomerNeed.MORTGAGE | | Product.LOAN | |
| 18 | NeedsAssessmentMortgage2 | | CustomerAssets.FROM150KTO300K | CustomerNeed.MORTGAGE | | Product.LOAN | |
| 19 | NeedsAssessmentMortgage3 | | CustomerAssets.OVER300K | CustomerNeed.MORTGAGE | | Product.SUPERLOAN | |

## Required Header Structure

### Metadata Headers (Required)

1. **RuleSet** (Row 1, Column A): Defines the package name for the generated rules
   - Format: `RuleSet | <package.name>`
   - Example: `RuleSet | net.cloudburo.drools`

2. **Import** (Row 2, Column A): Lists all Java classes and enums needed by the rules
   - Format: `Import | <comma.separated.class.names>`
   - Must include all model classes and their inner enums
   - Example: `Import | net.cloudburo.drools.model.Customer, net.cloudburo.drools.model.Customer.CustomerLifeStage`

3. **Variables** (Row 3, Column A): Declares global variables available to all rules
   - Format: `Variables | <type> <variableName>`
   - Example: `Variables | net.cloudburo.drools.model.Offer offer`

4. **Notes** (Row 4, Column A): Optional documentation describing the decision table purpose
   - Format: `Notes | <description text>`

### Rule Table Headers (Required)

1. **RuleTable Declaration** (Row 6): Names the decision table
   - Format: `RuleTable <TableName>`
   - Example: `RuleTable Initial Product Offering`

2. **Column Type Headers** (Row 7): Defines the type of each column
   - `NAME`: Rule name column
   - `CONDITION`: Condition columns (can have multiple)
   - `ACTION`: Action columns (can have multiple)

3. **Object Binding** (Row 8): Defines the objects available for conditions
   - Format: `$<objectName>:<ClassName>`
   - Example: `$customer:Customer`
   - Can span multiple columns if merged

4. **Pattern Templates** (Row 9): Defines the condition and action patterns with parameter placeholders
   - Conditions use `$param` as placeholder for values from rule rows
   - Actions use `$param` for parameter substitution
   - Examples:
     - Condition: `$customer.getLifeStage() in ($param)`
     - Action: `offer.setDiscount($param);`

5. **Column Labels** (Row 10): Human-readable column descriptions
   - Provides business-friendly names for each column
   - Examples: "Customer type", "Assets", "Discount"

### Rule Data Rows (Row 11+)

Each subsequent row defines a single business rule:
- **Column A**: Unique rule name
- **Condition Columns**: Values that get substituted for `$param` in condition patterns
- **Action Columns**: Values that get substituted for `$param` in action patterns
- **Empty cells**: Conditions/actions that don't apply to this rule

## Excel Formatting Requirements

### Critical Formatting Rules

1. **Merged Cells**: 
   - Metadata rows (1-4) often have merged cells spanning columns B-G
   - Object binding row (8) may have merged cells for complex object declarations
   - RuleTable declaration (6) typically spans multiple columns

2. **Cell Data Types**:
   - Text cells for rule names, enum values, and method calls
   - Numeric cells for numeric parameters (discounts, amounts)
   - Empty cells must remain truly empty (not contain spaces)

3. **Column Alignment**:
   - Condition and action patterns (row 9) must align with their respective column headers
   - Rule data must align with the correct condition/action columns

4. **Worksheet Structure**:
   - Primary decision table should be on the first worksheet
   - Additional worksheets are ignored by Drools processing
   - Worksheet can be named anything (e.g., "ProductOffering")

### Formatting Preservation Requirements

1. **Row Structure**: The exact row positions are critical:
   - Rows 1-4: Metadata
   - Row 5: Empty separator
   - Row 6: RuleTable declaration
   - Rows 7-10: Headers and patterns
   - Row 11+: Rule data

2. **Column Structure**: 
   - Column A always contains rule names or metadata labels
   - Columns B+ contain conditions and actions in declared order
   - Empty columns between sections are preserved

3. **Cell Merging**: 
   - Preserve merged cell ranges exactly as they appear
   - Merged cells are used for spanning complex declarations across columns

4. **Data Types**:
   - Maintain original Excel data types (text, number, formula)
   - Preserve numeric formatting for parameters
   - Keep empty cells as null values, not empty strings

## Data Model Requirements

Based on the example, the following Java model structure is expected:

### Customer Model
```java
public class Customer {
    public enum CustomerLifeStage {
        CAREERFOCUSED, FAMILY, RETIREMENT
    }
    
    public enum CustomerAssets {
        TO50K, FROM50KTO150K, FROM150KTO300K, OVER300K
    }
    
    public enum CustomerNeed {
        LIFEINSURANCE, MORTGAGE, INVESTMENT
    }
    
    private CustomerLifeStage lifeStage;
    private CustomerAssets assets;
    private List<CustomerNeed> needs;
}
```

### Offer Model
```java
public class Offer {
    public enum ProductPackage {
        GETTINGSTARTED_PACKAGE, CAREERFOCUSED_PACKAGE
    }
    
    public enum Product {
        LOAN, SUPERLOAN, INSURANCE
    }
    
    private ProductPackage financialPackage;
    private List<Product> products;
    private int discount;
}
```

## Validation Rules

1. **Metadata Validation**:
   - RuleSet must specify valid Java package name
   - Import must list all classes referenced in conditions/actions
   - Variables must use valid Java type declarations

2. **Header Validation**:
   - Column type headers must be NAME, CONDITION, or ACTION
   - Pattern templates must use valid Java syntax with $param placeholders
   - Object bindings must reference imported classes

3. **Rule Data Validation**:
   - Rule names must be unique within the table
   - Condition values must match expected enum values or data types
   - Action parameters must be compatible with method signatures

4. **Structure Validation**:
   - Required rows must be present in correct positions
   - At least one CONDITION and one ACTION column required
   - Rule data rows must have values in NAME column

## Processing Notes

- Drools converts the Excel format to DRL (Drools Rule Language) at runtime
- Empty cells in condition columns mean that condition doesn't apply to that rule
- Empty cells in action columns mean that action isn't executed for that rule
- Parameter substitution happens during DRL generation using the $param placeholder mechanism
- The generated DRL maintains the logical structure defined in the Excel format
