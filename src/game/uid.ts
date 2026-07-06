
class UID {
	static id = 0;
}

function* uid() {

	while (1) {
		yield UID.id++;
	}

}

export const Uid = uid()
