import { resolversDatabase, typeDefsDatabase } from './app/database';
import { typeDefsHello, resolversHello } from './app/hello';

export const TypedefsApp = [typeDefsHello, typeDefsDatabase];

export const ResolversApp = [resolversHello, resolversDatabase];
