import { join } from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {
    getStaticProductImage(imageName: string) {
        const path: string = join(__dirname, `../../static/products/${imageName}`);

        if (!existsSync(path)) {
            throw new BadRequestException(`No product found with this image ${imageName}`)
        }

        return path;        
    }
}
