# Procurement-Software

The goal is to create an interactive map which displays a marker over the county capital and displays all the data associated with that county. The 'Contact' column and google map column should be relayed with 

const contactUrl = 
  'https://www.google.com/search?q=' +
  encodeURIComponent(company + ' contact information');

const mapUrl =    
  'https://www.google.com/maps/search/' +
  encodeURIComponent(company + ', ' + county + ' County, ' + state);

Provided one Excel database that comprises of 9 different worksheets.  The first sheet defines California Data – County Name, Service Types, Company Name, notes, contact, google maps columns. The second sheet - 'CA' has listed all the county specific data - county seat, longitude and latitude info, population, area.  The third sheet is for Arizona County Data - Arizona County name, service type, company name, notes, contact, google maps. The fourth sheet - 'AZ' has listed all the county specific data - county seat, longitude and latitude info, population, area. The fifth sheet is for Texas County Data - Texas county name, service type, company name, notes on the company,  Contact information, Google Maps. The sixth sheet - 'TX' has listed all the county specific data - county seat, longitude and latitude info, population, area.  The seventh sheet defines the top suppliers of BESS equipment in each of the three states, with summaries of their key presence. This includes different BESS equipment materials.  The eighth sheet defines all the company names (listed as subcontracters) which are currently on SOLV MSA (master suject agreement). The ninth sheet lists all of SOLV's present BESS sites in California, Arizona, Texas along with their Energy Capacity and Client and long/lat.
