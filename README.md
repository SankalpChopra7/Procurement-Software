# Procurement-Software

This project visualizes local procurement (companies by service type) and BESS projects from an Excel workbook on an interactive map. The map can switch between 2D and 3D views using CesiumJS with OpenStreetMap tiles. Weather data is fetched from the free Open-Meteo API. The goal is to create an interactive map which displays a marker over the county capital and lists all the service type followed by company name and notes. The 'Contact' column displays a hyperlink that redirects you to a google search of the company (=HYPERLINK("https://www.google.com/search?q=" & ENCODEURL(C2 & " contact information"), "Contact Information")) and not precise contact information. The 'location on google maps' column does the same =HYPERLINK("https://www.google.com/maps/search/" & ENCODEURL(C3 & ", " & A3 & " County, California"), "Link to Google Maps"). These contact and location on google maps hyperlinks should allow the user to be rerouted to the companies google search. 

Provided one Excel database that comprises of 6 different Sheets. 

The first sheet defines California  Data – California County, Service Types, Company Name, link to their Google Contact information, and location on Google Maps.

The second sheet is for Arizona County Data, including county name, service type, company name, notes on the company, link to their Google Contact information, and location on Google Maps.

The third sheet is for Texas County Data, including county name, service type, company name, notes on the company, link to their Google Contact information, longitude and latitude of county (may ignore) and location on Google Maps. 

The fourth sheet defines the top suppliers of BESS equipment in each of the three states, with summaries of their key presence. This includes different BESS equipment materials.

The fifth sheet defines all the company names (listed as subcontracters) which are currently on SOLV MSA (master suject agreement) 

The sixth sheet lists all of SOLV's present BESS sites in California, Arizona, Texas along with their Energy Capacity and Client. 
