import { Injectable } from '@nestjs/common';

@Injectable()
export class ConstantService {
    public TRACE_ID_HEADER_NAME = 'x-matr-trace-id';
}
