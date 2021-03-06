var request = require("request");
var yaml = require("js-yaml");
var fs = require("fs-extra");
var path  = require("path");
var stringify = require('json-stable-stringify');
var unidecode = require('unidecode'); 

var DataPacksExportBuildFile = module.exports = function(vlocity) {
    var self = this;
    self.vlocity = vlocity || {};
};

DataPacksExportBuildFile.prototype.resetExportBuildFile = function(jobInfo) {
    this.setFilename(jobInfo);
    fs.outputFileSync(this.filename, stringify([], { space: 4 }), 'utf8');
};

DataPacksExportBuildFile.prototype.setFilename = function(jobInfo) {

    if (jobInfo.exportBuildFile) {
        this.filename = jobInfo.projectPath + '/' + jobInfo.exportBuildFile;
    } else {
        this.filename = path.join(__dirname, "../vlocity-deploy-temp/allExportedDataPacks.json");
    }
};

DataPacksExportBuildFile.prototype.loadExportBuildFile = function(jobInfo) {
    this.setFilename(jobInfo);

    if (!this.currentExportFileData) { 
        try {
            this.currentExportFileData = {};
            JSON.parse(fs.readFileSync(this.filename, 'utf8')).forEach(function(dataPack) {
                this.currentExportFileData[dataPack.VlocityDataPackData.Id] = dataPack;
            });
            
        } catch (e) {
            this.currentExportFileData = {};
        }
    }
}

DataPacksExportBuildFile.prototype.addToExportBuildFile = function(jobInfo, dataPackData) {
    var self = this;

    self.loadExportBuildFile(jobInfo);

    dataPackData.dataPacks.forEach(function(dataPack) {
        if (dataPack.VlocityDataPackStatus == 'Success') {

            var copiedDataPack = JSON.parse(stringify(dataPack));

            if (!copiedDataPack.VlocityDataPackParents) {
                copiedDataPack.VlocityDataPackParents = [];
            }

            if (!copiedDataPack.VlocityDataPackAllRelationships) {
                copiedDataPack.VlocityDataPackAllRelationships = {};
            }

            if (!self.currentExportFileData[copiedDataPack.VlocityDataPackData.Id]) {
                self.currentExportFileData[copiedDataPack.VlocityDataPackData.Id] = copiedDataPack;
            } else {
                var existingDataPack = self.currentExportFileData[copiedDataPack.VlocityDataPackData.Id];

                copiedDataPack.VlocityDataPackParents.forEach(function(parentKey) {
                    if (existingDataPack.VlocityDataPackParents.indexOf(parentKey) == -1) {
                        existingDataPack.VlocityDataPackParents.push(parentKey);
                    }
                });

                Object.keys(copiedDataPack.VlocityDataPackAllRelationships).forEach(function(relKey) {
                    existingDataPack.VlocityDataPackAllRelationships[relKey] = copiedDataPack.VlocityDataPackAllRelationships[relKey];
                });
            }
        }
    });

    var savedFormat = [];

    Object.keys(self.currentExportFileData).forEach(function(dataPackId) {
        savedFormat.push(self.currentExportFileData[dataPackId]);
    });

    fs.outputFileSync(self.filename, stringify(savedFormat, { space: 4 }), 'utf8');
};
