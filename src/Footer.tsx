const Footer = () => {
  return (
    <footer className="font-montserrat text-white py-6 text-sm">
      <div className="max-w-6xl mx-auto px-4">
        {false && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* About Section */}
            <div>
              <h4 className="text-lg font-bold mb-2">About</h4>
              <p>
                Boxi Huang, Front-End Developer. <br />
                Specializing in React, Next.js, and modern web animation
                frameworks.
              </p>
            </div>

            {/* Contact Section */}
            <div>
              <h4 className="text-lg font-bold mb-2">Contact</h4>
              <ul>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:todelusion@gmail.com"
                    className="text-blue-400"
                  >
                    todelusion@gmail.com
                  </a>
                </li>
                <li>
                  Phone:{" "}
                  <a href="tel:+886923608839" className="text-blue-400">
                    0923608839
                  </a>
                </li>
                <li>Location: Taipei, Taiwan</li>
              </ul>
            </div>

            {/* Links Section */}
            <div>
              <h4 className="text-lg font-bold mb-2">Links</h4>
              <ul>
                <li>
                  Portfolio:{" "}
                  <a
                    href="https://boxi-jack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400"
                  >
                    boxi-jack.com
                  </a>
                </li>
                <li>
                  GitHub:{" "}
                  <a
                    href="https://github.com/todelusion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400"
                  >
                    github.com/todelusion
                  </a>
                </li>
                <li>
                  LinkedIn:{" "}
                  <a
                    href="https://www.linkedin.com/in/boxi-huang-51636b20a/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400"
                  >
                    linkedin.com/in/boxi-huang
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* About the Tool Section */}
        <div className="mt-8">
          <h4 className="text-lg font-bold mb-2">About the Tool</h4>
          <p>
            This webpage serves as a markdown-driven threads post tool with the
            following features:
          </p>
          <ul className="list-disc list-inside">
            <li>Markdown-driven thread post creation.</li>
            <li>Automatic conversion to pure text supported by Threads.</li>
            <li>Code blocks are automatically converted into images.</li>
            <li>Markdown tables are converted into images.</li>
            <li>
              Supports the <code>§§§</code> symbol to recognize new thread
              posts.
            </li>
          </ul>
        </div>

        <div className="text-center mt-6 border-t border-gray-700 pt-4">
          <p>
            &copy; 2024{" "}
            <a
              href="https://boxi-jack.com/"
              className="underline"
              target="_blank"
            >
              Boxi Jack.
            </a>{" "}
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
