
Milestone 1
Milestone Outputs	
Documentation on project requirements and objectives.

Development environment set up.

Database schema design for SQL.

Initial synchronization mechanisms and API integration.

Basic script validator that will hold a datum to use as example entity to test and show the synchronization between the blockchain and the database.

Acceptance criteria	
Documentation of the project requirements and objectives completed. The documentation will be comprehensive, easy to understand, and accessible to both technical and non-technical community members.

Development environment set up prepared and ready to use as scaffold for a generic project.  

Database schema designed and running with a Mongo DB engine. 

Initial synchronization mechanisms and API integration working as expected using the example smart contract and its datum.

Evidence of milestone completion	
Documentation about requirements and objectives are public on a ReadMe on the GitHub repository

Setup of the development environment: source code will include project and package files to setup a VCode IDE with tools and config files. It will use NodeJS as main framework for front and back end and Cardano Serialization lib and Lucid as frameworks to handle wallet connection and Cardano blockchain integration.

Database schema design will be on the source code, as entities. The app will create tables on the fly if they don't exists. 

Functional synchronization mechanisms and API integration: video showcasing the population of the new entity in our database with what is found in the example smart contract's datum on the blockchain.


Milestone 2

Designed REST API endpoints for accessing and reading the database.

API documentation that covers all endpoints, request/response formats, error codes, and usage examples. This documentation will be easily accessible and understandable to developers of all skill levels interested in integrating with the database system.

Implemented routes, controllers, and middleware for the REST API.

Integrated authentication and authorization mechanisms. We will use https://next-auth.js.org/ as main session manager, and JWT with Lucid to create a signed token to verify the user session in the backend. 

Tested and validated the functionality of the REST API.

Acceptance criteria	
REST API endpoints designed and implemented. 

Json file with all the Swagger documentation accessible in the public GitHub repository.

Authentication and authorization mechanisms integrated. 

REST API functionality successfully tested and validated.

Evidence of milestone completion	
GitHub with all the code, screenshots or commits showcasing the code for new milestone

Swagger documentation for API endpoints. 

We will see if we can create a public server to allow others try the REST API by themself using postman. If not, we will provide a video showcasing all the basic routes and functionalities. In any case a Live API Demonstration could be also possible.

We will create a spreadsheet file with the results of covering for each API endpoint with some or all of this validations:

Positive and Negative Scenarios: Test both valid and invalid inputs.
Boundary Values: Test edge cases (e.g., minimum, maximum values).
Authentication and Authorization: Verify access control mechanisms.
Data Validation: Check input/output data formats.
Error Handling: Test error responses (e.g., 404, 500).
Performance Testing: Assess response times under load.
Security Testing: Look for vulnerabilities (e.g., SQL injection, XSS).
