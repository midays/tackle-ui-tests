/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import {
    clickByText,
    login,
    getRandomApplicationData,
    getRandomAnalysisData,
} from "../../../../../utils/utils";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import {
    button,
    clearAllFilters,
    CredentialType,
    UserCredentials,
    SEC,
} from "../../../../types/constants";
import * as data from "../../../../../utils/data_utils";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { Tag } from "../../../../models/migration/controls/tags";
import { TagCategory } from "../../../../models/migration/controls/tagcategory";
import { appDetailsView } from "../../../../views/applicationinventory.view";
let source_credential;
let tagCategory;
let tag;

describe(["@tier3"], "Filter tags on application details page", () => {
    before("Login", function () {
        login();
        source_credential = new CredentialsSourceControlUsername(
            data.getRandomCredentialsData(
                CredentialType.sourceControl,
                UserCredentials.usernamePassword,
                true
            )
        );
        source_credential.create();

        tagCategory = new TagCategory(
            data.getRandomWord(8),
            data.getColor(),
            data.getRandomNumber(1, 30)
        );
        tagCategory.create();

        tag = new Tag(data.getRandomWord(6), tagCategory.name);
        tag.create();
    });

    beforeEach("Load data", function () {
        cy.fixture("application").then(function (appData) {
            this.appData = appData;
        });
        cy.fixture("analysis").then(function (analysisData) {
            this.analysisData = analysisData;
            this.techTags = analysisData["analysis_for_enableTagging"]["techTags"];
        });
        cy.intercept("GET", "/hub/application*").as("getApplication");
    });

    it("Filter by automated tags generated after analysis", function () {
        // Automates Polarion MTA-310
        const application = new Analysis(
            getRandomApplicationData(
                "tackleTestApp_Source_autoTagging",
                {
                    sourceData: this.appData["tackle-testapp-git"],
                },
                [tag.name]
            ),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application.create();
        cy.wait("@getApplication");
        application.manageCredentials(source_credential.name, null);
        application.analyze();
        application.verifyAnalysisStatus("Completed");

        application.filterTags("Analysis");
        application.tagAndCategoryExists(this.techTags);
        cy.get(appDetailsView.applicationTag).should("not.contain", tag.name);
        clickByText(button, clearAllFilters);
        application.closeApplicationDetails();

        application.delete();
    });

    it("Filter by manual tags", function () {
        // Automates Polarion MTA-310
        const application = new Analysis(
            getRandomApplicationData(
                "tackleTestApp_Source_autoTagging",
                {
                    sourceData: this.appData["tackle-testapp-git"],
                },
                [tag.name]
            ),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application.create();
        cy.wait("@getApplication");
        application.manageCredentials(source_credential.name, null);
        application.analyze();
        application.verifyAnalysisStatus("Completed");

        application.filterTags("Manual");
        this.techTags.forEach(function (tag) {
            cy.get(appDetailsView.applicationTag, { timeout: 10 * SEC }).should(
                "not.contain",
                tag[1]
            );
        });
        cy.get(appDetailsView.applicationTag).should("contain", tag.name);
        application.closeApplicationDetails();

        application.delete();
    });

    it("Filter tags by tag category", function () {
        // Automates Polarion MTA-311
        const application = new Analysis(
            getRandomApplicationData(
                "tackleTestApp_Source_autoTagging",
                {
                    sourceData: this.appData["tackle-testapp-git"],
                },
                [tag.name]
            ),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application.create();
        cy.wait("@getApplication");
        application.manageCredentials(source_credential.name, null);
        application.analyze();
        application.verifyAnalysisStatus("Completed");

        application.filterTags(tagCategory.name);
        this.techTags.forEach(function (tag) {
            cy.get(appDetailsView.applicationTag, { timeout: 10 * SEC }).should(
                "not.contain",
                tag[1]
            );
        });
        cy.get(appDetailsView.applicationTag).should("contain", tag.name);
        application.closeApplicationDetails();

        application.delete();
    });

    after("Perform test data clean up", function () {
        tag.delete();
        tagCategory.delete();
        source_credential.delete();
    });
});