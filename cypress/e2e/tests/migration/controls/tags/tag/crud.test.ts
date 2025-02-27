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
    closeRowDetails,
    exists,
    existsWithinRow,
    expandRowDetails,
    login,
    notExistsWithinRow,
    selectUserPerspective,
} from "../../../../../../utils/utils";
import { Tag } from "../../../../../models/migration/controls/tags";

import * as data from "../../../../../../utils/data_utils";
import { migration, tdTag } from "../../../../../types/constants";

describe(["@tier2"], "Tag CRUD operations", () => {
    beforeEach("Login", function () {
        login();

        // Interceptors
        cy.intercept("POST", "/hub/tag*").as("postTag");
        cy.intercept("GET", "/hub/tag*").as("getTag");
        cy.intercept("PUT", "/hub/tag/*").as("putTag");
        cy.intercept("DELETE", "/hub/tag/*").as("deleteTag");
    });

    it("Tag CRUD", function () {
        selectUserPerspective(migration);
        const tag = new Tag(data.getRandomWord(8), data.getRandomDefaultTagCategory());
        tag.create();
        cy.wait("@postTag");

        // Assert that created tag exists
        expandRowDetails(tag.tagCategory);
        existsWithinRow(tag.tagCategory, tdTag, tag.name);
        closeRowDetails(tag.tagCategory);

        // Edit the tag and tag category name
        let updatedTagName = data.getRandomWord(8);
        let updatedTagCategoryName = data.getRandomDefaultTagCategory();
        tag.edit({ name: updatedTagName, tagcategory: updatedTagCategoryName });
        cy.get("@putTag");
        cy.wait(2000);

        // Assert that tag type name got updated
        exists(updatedTagCategoryName);

        // Assert that tag name got updated
        expandRowDetails(updatedTagCategoryName);
        existsWithinRow(updatedTagCategoryName, tdTag, updatedTagName);
        closeRowDetails(updatedTagCategoryName);

        // Delete tag
        tag.delete();
        cy.get("@deleteTag");
        cy.wait(2000);

        // Assert that tag got deleted
        expandRowDetails(tag.tagCategory);
        notExistsWithinRow(tag.tagCategory, tdTag, tag.name);
        closeRowDetails(tag.tagCategory);
    });
});
