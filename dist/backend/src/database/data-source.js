"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const entities = require("./entities");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/teach_mini_app',
    entities: Object.values(entities),
    synchronize: true,
    logging: process.env.NODE_ENV !== 'production',
});
//# sourceMappingURL=data-source.js.map